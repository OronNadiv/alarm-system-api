const Promise = require('bluebird')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const Motion = require('../models/motion')

const second = 1000
const minute = second * 60
const hour = minute * 60
const day = hour * 24

const motions = Bookshelf.Collection.extend({
  tableName: 'motions',
  model: Motion
})

motions.purge = () => {
  Promise
    .resolve(motions
      .forge()
      .query((qb) => {
        const d = new Date()
        d.setDate(d.getDate() - config.keepHistoryInDays)
        qb.where('created_at', '<', d)
      })
      .fetch())
    .get('models')
    .map((model) => {
      return model.destroy()
    })
    .delay(day)
    .then(() => {
      return motions.purge()
    })
}

module.exports = motions
