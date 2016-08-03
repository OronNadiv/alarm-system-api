const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const info = log.info.bind(log, LOG_PREFIX)
const warn = log.warn.bind(log, LOG_PREFIX)

import {Router} from 'express'
import Ack from '../db/models/ack'
import moment from 'moment'
import Motions from '../db/collections/motions'
import Motion from '../db/models/motion'
import Promise from 'bluebird'
import Toggle from '../db/models/toggle'

const router = new Router()

router.get('/motions', (req, res, next) => {
  const count = parseInt(req.query.count || 20, 10)
  const days = parseInt(req.query.days || 1, 10)
  const options = {by: req.client}

  if (!req.client.is_trusted) {
    return res.sendStatus(403)
  }

  return Motions.forge()
    .query(qb => {
      qb.where('group_id', '=', options.by.group_id)
      qb.where('created_at', '>', moment().subtract(days, 'days').toDate())
      qb.orderBy('created_at', 'DESC')
      qb.limit(count)
    })
    .fetch(options)
    .call('toJSON')
    .then(res.json.bind(res))
    .catch(next)
})

router.post('/motions', (req, res, next) => {
  if (!req.body.sensor_name) {
    return res.sendStatus(422)
  }

  const options = {by: req.client}
  const sensorName = req.body.sensor_name

  Promise.all([
    Promise
        .resolve(Ack.fetchLatest(sensorName, options))
        .then(ack => {
          ack = ack || Ack.forge()
          // will update the 'updated_at' value.
          req.body.group_id = options.by.group_id
          return ack.save(req.body, options)
        }),
    Promise
        .resolve(Toggle.fetchLatest(options))
        .then(toggle => {
          if (!toggle || !toggle.get('is_armed')) {
            info(
              'Motion detected.  Alarm is not armed.  Ignoring.  Sensor name:',
              req.body.sensor_name
            )
            return
          }
          if (moment().diff(toggle.get('created_at'), 'minutes') < 2) {
            info(
              'Motion detected.  Alarm was armed less than two minutes ago.  Ignoring.  Sensor name:',
              req.body.sensor_name,
              'Armed at:',
              toggle.get('created_at')
            )
            return
          }
          return Promise
            .resolve(Motion.fetchLatest(sensorName, options))
            .then(motion => {
              if (motion && moment().diff(motion.get('created_at'), 'seconds') < 30) {
                warn(
                  'Motion detected.  Last motion was detected at: ',
                  motion.get('created_at'),
                  'skipping this motion. to prevent from having too much noise.'
                )
                return
              }
              return Motion.forge().save(req.body, options)
            })
        })
        .then(() => res.sendStatus(201))
  ])
    .catch(next)
})

export default router
