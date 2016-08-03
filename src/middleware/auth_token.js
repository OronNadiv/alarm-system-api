const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const info = log.info.bind(log, LOG_PREFIX)

import jwt from 'jsonwebtoken'
import config from '../config'

export default (req, res, next) => {
  function sendUnauthenticated () {
    info('Sending unauthorized - 401.')
    return res.sendStatus(401)
  }

  let token = req.cookies['XSRF-TOKEN']

  if (!token && req.headers.authorization) {
    const matched = req.headers.authorization.match(/Bearer (.+)/)
    if (matched.length > 1) {
      token = matched[1]
    }
  }

  if (!token || !token.length) {
    info('Token cannot be found. Url: ', req.url)
    return sendUnauthenticated()
  }

  jwt.verify(token, config.authPublicKey, (err, payload) => {
    if (err) {
      info('Issue while verifying token. Url: ', req.url)
      return sendUnauthenticated()
    }

    // token is valid

    req.client = payload
    return next()
  })
}
