const Router = require('express').Router
const config = require('../config')

const router = new Router()

router.get('/', (req, res) => res.redirect(config.uiUrl))

module.exports = router
