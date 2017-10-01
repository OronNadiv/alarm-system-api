const verbose = require('debug')('ha:db:models:ack:verbose')
const info = require('debug')('ha:db:models:ack:info')
const error = require('debug')('ha:db:models:ack:error')

const createClient = require('redis').createClient
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const emitter = require('socket.io-emitter')
const moment = require('moment')
const Promise = require('bluebird')
const md5 = require('md5')
const PubNub = require('pubnub')

const {publishKey, subscribeKey} = config.pubNub

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
      model.set('group_id', options.by.group_id)
    })

    this.on('saved', (model, attrs, options) => {
      verbose('sending message to client.', 'group_id:', options.by.group_id)

      let client = createClient(config.redisUrl)

      const promise1 = Promise
        .try(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          const io = emitter(client)
          io.of(`/${options.by.group_id}-trusted`).to('alarm-sensors').emit('ACK_SAVED', model.toJSON())
        })
        .finally(() => {
          if (client) {
            client.quit()
            client = null
          }
        })

      const promise2 = new Promise((resolve, reject) => {
        const authKey = md5(options.by.token)
        const publisher = new PubNub({
          publishKey,
          subscribeKey,
          authKey,
          ssl: true
        })

        const publishConfig = {
          message: {
            system: 'ALARM',
            type: 'ACK_SAVED',
            payload: model.toJSON()
          },
          channel: `${options.by.group_id}-trusted`
        }
        publisher.publish(publishConfig, (status) => {
          switch (status.statusCode) {
            case 200:
              info('Publish complete successfully.',
                'Hashed authKey:', md5(authKey))
              return resolve()
            default:
              error('Publish failed.',
                'Hashed authKey:', md5(authKey),
                'status:', status)
              reject(status)
          }
        })
      })

      return Promise.all([promise1, promise2])
    })
  }
})

ack.fetchLatest = (sensorName, options) => {
  return ack.forge()
    .query(qb => {
      qb.where('group_id', '=', options.by.group_id)
      qb.where('sensor_name', sensorName)
      qb.orderBy('created_at', 'DESC')
    })
    .fetch(options)
}

module.exports = ack
