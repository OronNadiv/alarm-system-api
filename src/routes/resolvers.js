const _ = require('underscore')
const Promise = require('bluebird')
const moment = require('moment')
const Acks = require('../db/collections/acks')
const Motions = require('../db/collections/Motions')
const Toggles = require('../db/collections/toggles')
const Toggle = require('../db/models/toggle')

module.exports = {
  Query: {
    acks (root, params, {client}) {
      const options = {by: client}

      if (!options.by.is_trusted) {
        throw new Error('Unauthorized.  This incident will be reported.')
      }

      return Promise
        .resolve(Acks.forge().fetch(options))
        .call('toJSON')
        .then((collection) => {
          return collection.map((toggle) => {
            return {
              id: toggle.id,
              requestedBy: toggle.requestedBy,
              createdAt: moment(state.created_at).format(),
              updatedAt: moment(state.updated_at).format(),
              sensorName: toggle.sensor_name
            }
          })
        })
    },
    motions (root, {count, days}, {client}) {
      const options = {by: client}

      if (!options.by.is_trusted) {
        throw new Error('Unauthorized.  This incident will be reported.')
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
        .then((collection) => {
          return collection.map((toggle) => {
            return {
              id: toggle.id,
              requestedBy: toggle.requestedBy,
              createdAt: moment(state.created_at).format(),
              updatedAt: moment(state.updated_at).format(),
              sensorName: toggle.sensor_name
            }
          })
        })
    },
    toggles (root, {count}, {client}) {
      const options = {by: client}
      return Promise
        .try(() =>
          new Toggles().query(qb => {
            qb.orderBy('created_at', 'DESC')
            qb.limit(count)
          }).fetch(_.extend({withRelated: ['requestedBy']}, options)))
        .call('toJSON')
        .then(collection => {
          return collection.map((toggle) => {
            return {
              id: toggle.id,
              requestedBy: toggle.requestedBy,
              isArmed: toggle.is_armed,
              createdAt: moment(state.created_at).format(),
              updatedAt: moment(state.updated_at).format()
            }
          })
        })
        .then((collection) => {
          if (!options.by.is_trusted) {
            collection = collection.length ? [_.pick(collection[0], 'is_armed')] : []
          }
          return collection
        })
    }
  },
  Mutation: {
    createToggle (root, {isArmed}, {client}) {
      const options = {by: client}
      return Promise
        .resolve(Toggle.fetchLatest(options))
        .then(model => {
          if (model && model.get('is_armed') === isArmed) {
            verbose(
              'system\'s state is the same as requested.  current:',
              model.get('is_armed'),
              'requested:',
              isArmed
            )
            return {}
          }
          return new Toggle()
            .save({
              requested_by_id: options.by.id,
              is_armed: isArmed
            }, options)
        })
        .then(({id}) => ({id}))

    }
  }
}
