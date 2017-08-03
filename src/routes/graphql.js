const graphqlExpress = require('apollo-server-express').graphqlExpress
const makeExecutableSchema = require('graphql-tools').makeExecutableSchema
const config = require('../config')
const Router = require('express').Router
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')

const router = new Router()
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

router.use('/graphql', graphqlExpress(request => ({
  schema: schema,
  context: {client: request.client},
  pretty: !config.production,
  graphiql: !config.production
})))

module.exports = router
