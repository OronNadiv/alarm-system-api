const error = require('debug')('ha:app:error')

import diehard from 'diehard'
import domain from 'domain'
import expressInitializer from './initializations/express'
import Motions from './db/collections/motions'
import Promise from 'bluebird'
import Toggles from './db/collections/toggles'

const d = domain.create()

d.on('error', error)

d.run(() => {
  Promise
    .try(Motions.purge)
    .then(Toggles.purge)
    .then(expressInitializer.initialize)
    .then(() => diehard.listen({timeout: 5000}))
})
