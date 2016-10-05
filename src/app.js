const error = require('debug')('ha:app:error')

const diehard = require('diehard')
const domain = require('domain')
const expressInitializer = require('./initializations/express')
const Motions = require('./db/collections/motions')
const Promise = require('bluebird')
const Toggles = require('./db/collections/toggles')

const d = domain.create()

d.on('error', error)

d.run(() => {
  Promise
    .resolve(Motions.purge())
    .then(() => {
      return Toggles.purge()
    })
    .then(() => {
      return expressInitializer.initialize()
    })
    .then(() => diehard.listen({timeout: 5000}))
})
