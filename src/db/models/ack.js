const verbose = require('debug')('ha:db:models:ack:verbose')

import {createClient} from 'redis'
import Bookshelf from '../bookshelf'
import config from '../../config'
import emitter from 'socket.io-emitter'
import moment from 'moment'
import Promise from 'bluebird'

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
      let client = createClient(config.redisUrl)

      return Promise
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

export default ack
