const verbose = require('debug')('ha:db:models:ack:verbose')

const Promise = require('bluebird')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const moment = require('moment')
const {publish} = require('home-automation-pubnub').Publisher

const JWTGenerator = require('jwt-generator')
const jwtGenerator = new JWTGenerator({
  loginUrl: config.loginUrl,
  privateKey: config.privateKey,
  useRetry: false,
  issuer: 'urn:home-automation/alarm'
})

const ack = Bookshelf.Model.extend({
  tableName: 'acks',
  hasTimestamps: true,
  virtuals: {
    mayBeFaulty: function () {
      return moment().diff(this.get('updated_at'), 'days') > config.sensorMayBeFaultyInDays
    }
  },
  initialize () {
    this.on('saving', (model, attrs, options) => {
    })

    this.on('saved', (model, attrs, options) => {
      verbose('sending message to client. group_id:', options.by.group_id)

      return Promise
        .resolve(jwtGenerator.makeToken({
          subject: `Alarm toggle created for group ${options.by.group_id}`,
          audience: 'urn:home-automation/alarm',
          payload: options.by
        }))
        .then((token) => {
          return publish({
            groupId: options.by.group_id,
            isTrusted: true,
            system: 'ALARM',
            type: 'ACK_SAVED',
            payload: model.toJSON(),
            token,
            uuid: 'alarm-system-api'
          })
        })
    })
  }
})

ack.fetchLatest = (sensorName, options) => {
  verbose('fetchLatest called.',
    'sensorName:', sensorName,
    'group_id:', options.by.group_id)
  return ack.forge()
    .query(qb => {
      qb.where('group_id', '=', options.by.group_id)
      qb.where('sensor_name', sensorName)
      qb.orderBy('created_at', 'DESC')
    })
    .fetch(options)
}

module.exports = ack
