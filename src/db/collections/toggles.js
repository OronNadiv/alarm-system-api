const Promise = require('bluebird')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const Toggle = require('../models/toggle')

const second = 1000
const minute = second * 60
const hour = minute * 60
const day = hour * 24

const toggles = Bookshelf.Collection.extend({
  tableName: 'toggles',
  model: Toggle
})

toggles.purge = () => {
  Promise
    .resolve(toggles
      .forge()
      .query((qb) => {
        const d = new Date()
        d.setDate(d.getDate() - config.keepHistoryInDays)
        qb.where('created_at', '<', d)
      })
      .fetch()
    )
    .get('models')
    .map((model) => {
      return model.destroy()
    })
    .delay(day)
    .then(() => {
      return toggles.purge()
    })
}

module.exports = toggles
