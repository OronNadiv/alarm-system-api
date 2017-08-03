const verbose = require('debug')('ha:initializations:express:verbose')
const info = require('debug')('ha:initializations:express:info')
const warn = require('debug')('ha:initializations:express:warn')
const error = require('debug')('ha:initializations:express:error')

const acks = require('./../routes/acks')
const authToken = require('./../middleware/auth_token')
const bodyParser = require('body-parser')
const config = require('./../config')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const diehard = require('diehard')
const express = require('express')
const home = require('./../routes/home')
const motions = require('./../routes/motions')
const ping = require('./../middleware/ping')
const Promise = require('bluebird')
const redirectToHttps = require('./../middleware/redirect_to_https')
const toggles = require('./../routes/toggles')
const xHeaders = require('./../middleware/x_headers')

const app = express()

module.exports = {
  initialize: () => new Promise(resolve => {
    app.use('/ping', ping)
    app.use(home)
    app.use(cors({
      origin: config.uiUrl,
      credentials: true,
      exposedHeaders: ['X-Total-Count'],
      maxAge: 10 * 60
    }))
    app.use(redirectToHttps)
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(cookieParser())
    app.use(xHeaders)
    app.use(authToken)

    app.use(acks)
    app.use(motions)
    app.use(toggles)

    app.use((err, req, res) => {
      if (!(err instanceof Error)) {
        // req is actually res.
        warn('unknown request.  See logs for more details.')
        return req.sendStatus(404)
      }
      error('sending Error.  Err: ', err)
      return res.sendStatus(err.status || 500)
    })

    const server = app.listen(config.port, () => {
      info(`Express server listening on port ${server.address().port}`)

      diehard.register(done => {
        verbose('Shutting down http server')
        server.close(() => {
          verbose('Http server was shutdown successfully.')
          done()
        })
      })

      resolve({server: server, express: app})
    })
  })
}
