const verbose = require('debug')('ha:db:models:toggle:verbose')

const _ = require('underscore')
const config = require('../../config')
const Bookshelf = require('../bookshelf')
const Promise = require('bluebird')
const user = require('./user')
const JWTGenerator = require('jwt-generator')
const jwtGenerator = new JWTGenerator({
  loginUrl: config.loginUrl,
  privateKey: config.privateKey,
  useRetry: false,
  issuer: 'urn:home-automation/alarm'
})

const {publish} = require('home-automation-pubnub').Publisher

const toggle = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })
    this.on('created', (model, attrs, options) => {
      const {id, group_id} = options.by
      return Promise
        .all([
          jwtGenerator.makeToken({
            subject: `Alarm toggle created for group ${options.by.group_id}`,
            audience: 'urn:home-automation/alarm',
            payload: {id, group_id}
          }),
          model.load(['requestedBy'])
        ])
        .spread((token) => {
          verbose('sending message to client. group_id:', options.by.group_id)

          return Promise.all([
            publish({
              groupId: options.by.group_id,
              isTrusted: true,
              system: 'ALARM',
              type: 'TOGGLE_CREATED',
              payload: model.toJSON(),
              token,
              uuid: 'alarm-system-api'
            }),
            publish({
              groupId: options.by.group_id,
              isTrusted: false,
              system: 'ALARM',
              type: 'TOGGLE_CREATED',
              payload: _.pick(model.toJSON(), 'is_armed'),
              token,
              uuid: 'alarm-system-api'
            })
          ])
        })
    })
    this.on('updating', () => {
      throw new Error('Motion cannot be changed after creation.')
    })
  },
  requestedBy () {
    return this.belongsTo(user, 'requested_by_id')
  }
})

toggle.fetchLatest = options => {
  return toggle.forge()
    .query(qb => {
      qb.where('group_id', '=', options.by.group_id)
      qb.orderBy('created_at', 'DESC')
    })
    .fetch(options)
}

module.exports = toggle
