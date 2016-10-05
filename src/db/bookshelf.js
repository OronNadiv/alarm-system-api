const verbose = require('debug')('ha:db:bookshelf:verbose')

const diehard = require('diehard')
const knex = require('knex')
const bookshelf = require('bookshelf')
const knexConfiguration = require('./knex')

const repository = bookshelf(knex(knexConfiguration))

repository.plugin('visibility')
repository.plugin('virtuals')

diehard.register(done => {
  verbose('Shutting down postgres connection.')
  repository.knex.destroy(() => {
    verbose('Postgres connection shutdown successfully.')
    done()
  })
})

module.exports = repository
