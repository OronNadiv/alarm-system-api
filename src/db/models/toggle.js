const verbose = require('debug')('ha:db:models:toggle:verbose')

import {createClient} from 'redis'
import _ from 'underscore'
import Bookshelf from '../bookshelf'
import config from '../../config'
import emitter from 'socket.io-emitter'
import Promise from 'bluebird'
import user from './user'

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
          .try(() => {
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

export default toggle
