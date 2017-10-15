const verbose = require('debug')('ha:db:models:ack:verbose')

const Bookshelf = require('../bookshelf')
const config = require('../../config')
const moment = require('moment')
const {publish} = require('home-automation-pubnub').Publisher

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

      return publish({
        groupId: options.by.group_id,
        isTrusted: true,
        system: 'ALARM',
        type: 'ACK_SAVED',
        payload: model.toJSON(),
        token: options.by.token,
        uuid: 'alarm-system-api'
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
