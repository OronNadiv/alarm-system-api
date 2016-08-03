import config from '../config'

export default (req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'https' || !config.production) {
    return next()
  }
  res.redirect(`https://${req.hostname}${req.url}`)
}
