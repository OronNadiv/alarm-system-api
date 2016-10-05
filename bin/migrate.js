const configuration = require('../src/db/knex')

module.exports = {
  development: configuration,
  test: configuration,
  production: configuration
}
