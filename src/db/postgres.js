const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const error = log.error.bind(log, LOG_PREFIX)

import pg from 'pg'
import config from '../config'

const db = new pg.Client(config.postgres)

db.connect(err => {
  if (err) {
    error('Could not connect to postgres. err: ', err)
    /* eslint-disable no-process-exit */
    return process.exit(2)
    /* eslint-enable no-process-exit */
  }
  verbose('Connected to postgres db')
})

export default db
