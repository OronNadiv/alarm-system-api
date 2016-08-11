const verbose = require('debug')('ha:routes:toggles:verbose')

import {Router} from 'express'
import _ from 'underscore'
import Promise from 'bluebird'
import Toggles from '../db/collections/toggles'
import Toggle from '../db/models/toggle'

const router = new Router()

router.get('/toggles', (req, res, next) => {
  const count = parseInt(req.query.count || 20, 10)
  const options = {by: req.client}
  Promise
    .try(() =>
      new Toggles().query(qb => {
        qb.orderBy('created_at', 'DESC')
        qb.limit(count)
      }).fetch(_.extend({withRelated: ['requestedBy']}, options)))
    .call('toJSON')
    .then(collection => {
      if (!req.client.is_trusted) {
        collection = collection.length ? [_.pick(collection[0], 'is_armed')] : []
      }
      return collection
    })
    .then(res.json.bind(res))
    .catch(next)
})

router.post('/toggles', (req, res, next) => {
  if (!_.isBoolean(req.body.is_armed)) {
    return res.sendStatus(422)
  }
  const options = {by: req.client}
  Toggle.fetchLatest(options)
    .then(model => {
      if (model && model.get('is_armed') === req.body.is_armed) {
        verbose(
          'system\'s state is the same as requested.  current:',
          model.get('is_armed'),
          'requested:',
          req.body.is_armed
        )
        return res.sendStatus(201)
      }
      return new Toggle()
        .save({
          requested_by_id: options.by.id,
          is_armed: req.body.is_armed
        }, options)
        .then(() => res.sendStatus(201))
    })
    .catch(next)
})

export default router
