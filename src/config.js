const error = require('debug')('ha:config:error')

const fs = require('fs')
const path = require('path')

const config = {production: process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'PRODUCTION'}

config.port = process.env.PORT || 3002

config.skipSSL = process.env.SKIP_SSL && process.env.SKIP_SSL.toUpperCase() === 'TRUE'

config.authPublicKey = process.env.AUTH_PUBLIC_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/public_key.pem')))
if (!config.authPublicKey) {
  error(
    'Login public key could not be found in the environment variable.  Please set \'AUTH_PUBLIC_KEY\'.'
  )
  process.exit(1)
}

config.privateKey = process.env.PRIVATE_KEY || (config.production ? null : fs.readFileSync(path.join(__dirname, '../test/keys/private_key.pem')))
if (!config.privateKey) {
  error(
    'Private key could not be found in the environment variable.  Please set \'PRIVATE_KEY\'.'
  )
  process.exit(1)
}

config.keepHistoryInDays = parseInt(process.env.KEEP_HISTORY_IN_DAYS || 30, 10)

config.postgres = process.env.DATABASE_URL || 'postgres://postgres:@localhost/home_automation'
config.postgresPool = {
  min: parseInt(process.env.POSTGRESPOOLMIN || 2, 10),
  max: parseInt(process.env.POSTGRESPOOLMAX || 10, 10),
  log: process.env.POSTGRESPOOLLOG === 'true',
  afterCreate: (connection, cb) => connection.query(`SET SESSION SCHEMA 'alarm';`, cb)
}

config.redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || (config.production ? null : 'redis://localhost:6379')
if (!config.redisUrl) {
  error(
    'Redis URL could not be found in the environment variable.  Please set \'REDIS_URL\'.'
  )
  process.exit(1)
}

config.loginUrl = process.env.LOGIN_URL || (config.production ? null : 'http://localhost:3001')
if (!config.loginUrl) {
  error(
    'Login URL could not be found in the environment variable.  Please set \'LOGIN_URL\'.'
  )
  process.exit(1)
}

config.notificationsUrl = process.env.NOTIFICATIONS_URL || 'http://localhost:3004'
if (!config.notificationsUrl) {
  error(
    'Notifications URL could not be found in the environment variable.  Please set \'NOTIFICATIONS_URL\'.'
  )
  process.exit(1)
}

config.uiUrl = process.env.UI_URL || 'http://localhost:3000'
if (!config.uiUrl) {
  error(
    'Login URL could not be found in the environment variable.  Please set \'UI_URL\'.'
  )
  process.exit(1)
}

config.motionDetectedSubject = process.env.MOTION_DETECTED_SUBJECT || 'ALERT - Motion has been detected!'
config.motionDetectedText = process.env.MOTION_DETECTED_TEXT ||
  `Motion has been detected while the alarm system is armed.

Sensor name: {sensor_name}`
config.sensorMayBeFaultyInDays = parseInt(process.env.SENSOR_MAY_BE_FAULTY_IN_DAYS || 7, 10)

module.exports = config
