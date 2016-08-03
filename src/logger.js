const winston = require('winston')
const logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      json: false
    })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({
      colorize: true,
      json: false,
      humanReadableUnhandledException: true
    })
  ],
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false
})

module.exports = logger
