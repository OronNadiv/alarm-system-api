const diehard = require('diehard')
const expressInitializer = require('./initializations/express')
const Motions = require('./db/collections/motions')
const Promise = require('bluebird')
const Toggles = require('./db/collections/toggles')

Promise
  .resolve(Motions.purge())
  .then(() => Toggles.purge())
  .then(() => expressInitializer.initialize())
  .then(() => diehard.listen({timeout: 5000}))
