const verbose = require('debug')('ha:db:models:toggle:verbose')

const _ = require('underscore')
const Bookshelf = require('../bookshelf')
const Promise = require('bluebird')
const user = require('./user')

const {publish} = require('home-automation-pubnub').Publisher

const toggle = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })
    this.on('created', (model, attrs, options) => {
      return Promise
        .resolve(model.load(['requestedBy']))
        .then(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          return Promise.all([
            publish({
              groupId: options.by.group_id,
              isTrusted: true,
              system: 'ALARM',
              type: 'TOGGLE_CREATED',
              payload: model.toJSON(),
              token: options.by.token
            }),
            publish({
              groupId: options.by.group_id,
              isTrusted: false,
              system: 'ALARM',
              type: 'TOGGLE_CREATED',
              payload: _.pick(model.toJSON(), 'is_armed'),
              token: options.by.token
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
