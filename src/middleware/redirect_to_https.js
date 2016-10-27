const config = require('../config')

module.exports = (req, res, next) => {
  if (config.skipSSL || req.headers['x-forwarded-proto'] === 'https' || !config.production) {
    return next()
  }
  res.redirect(`https://${req.hostname}${req.url}`)
}
