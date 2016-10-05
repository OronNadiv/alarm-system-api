const verbose = require('debug')('ha:db:postgres:verbose')
const error = require('debug')('ha:db:postgres:error')

const pg = require('pg')
const config = require('../config')

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

module.exports = db
