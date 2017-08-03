const config = require('../config')
const path = require('path')
const pg = require('pg')

pg.defaults.ssl = !config.production

module.exports = {
  // debug: true,
  client: 'pg',
  connection: config.postgres,
  pool: config.postgresPool,
  migrations: {
    directory: path.join(__dirname, '/migrations')
  }
}
