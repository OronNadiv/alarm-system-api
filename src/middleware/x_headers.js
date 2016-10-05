module.exports = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache')
  res.set('Pragma', 'no-cache')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  next()
}
