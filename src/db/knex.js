const config = require('../config')
const path = require('path')

module.exports = {
  // debug: true,
  client: 'pg',
  connection: config.postgres,
  pool: config.postgresPool,
  migrations: {
    directory: path.join(__dirname, '/migrations')
  }
}
