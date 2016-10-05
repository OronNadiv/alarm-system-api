const Router = require('express').Router
const Acks = require('../db/collections/acks')
const Promise = require('bluebird')

const router = new Router()

router.get('/acks', (req, res, next) => {
  if (!req.client.is_trusted) {
    return res.sendStatus(403)
  }

  const options = {by: req.client}

  Promise
    .resolve(Acks.forge().fetch(options))
    .call('toJSON')
    .then(res.json.bind(res))
    .catch(next)
})

module.exports = router
