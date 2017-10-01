const verbose = require('debug')('ha:db:models:toggle:verbose')
const info = require('debug')('ha:db:models:toggle:info')
const error = require('debug')('ha:db:models:toggle:error')

const _ = require('underscore')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const createClient = require('redis').createClient
const emitter = require('socket.io-emitter')
const Promise = require('bluebird')
const user = require('./user')

const md5 = require('md5')
const PubNub = require('pubnub')
const { publishKey, subscribeKey } = config.pubNub

const toggle = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })
    this.on('created', (model, attrs, options) => {
      let client = createClient(config.redisUrl)

      const p1 = Promise
        .resolve(model.load(['requestedBy']))
        .then(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          const io = emitter(client)

          io.of(`/${options.by.group_id}-trusted`).to('alarm-sensors').emit('TOGGLE_CREATED', model.toJSON())
          io.of(`/${options.by.group_id}`).to('alarm-sensors').emit('TOGGLE_CREATED', _.pick(model.toJSON(), 'is_armed'))
        })
        .finally(() => {
          if (client) {
            client.quit()
            client = null
          }
        })

      const authKey = md5(options.by.token)
      const publisher = new PubNub({
        publishKey,
        subscribeKey,
        authKey,
        ssl: true
      })

      const publishMessage = (channel, payload) => {
        return new Promise((resolve, reject) => {
          const publishConfig = {
            message: {
              system: 'ALARM',
              type: 'TOGGLE_CREATED',
              payload
            },
            channel
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
      }

      const p2 = Promise.all([
        publishMessage(`${options.by.group_id}`, _.pick(model.toJSON(), 'is_armed')),
        publishMessage(`${options.by.group_id}-trusted`, model.toJSON())
      ])
      return Promise.all([p1, p2])
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
