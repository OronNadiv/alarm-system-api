const verbose = require('debug')('ha:db:models:toggle:verbose')

const _ = require('underscore')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const createClient = require('redis').createClient
const emitter = require('socket.io-emitter')
const Promise = require('bluebird')
const user = require('./user')

const toggle = Bookshelf.Model.extend({
  tableName: 'toggles',
  hasTimestamps: true,
  initialize () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })
    this.on('created', (model, attrs, options) => {
      let client = createClient(config.redisUrl)

      return Promise
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
