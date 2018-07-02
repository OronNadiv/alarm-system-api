const verbose = require('debug')('ha:db:models:motion:verbose')
const info = require('debug')('ha:db:models:motion:info')
const error = require('debug')('ha:db:models:motion:error')

const Bookshelf = require('../bookshelf')
const config = require('../../config')
const Promise = require('bluebird')
const request = require('http-as-promised')
const url = require('url')
const {publish} = require('home-automation-pubnub').Publisher
const JWTGenerator = require('jwt-generator')
const jwtGenerator = new JWTGenerator({
  loginUrl: config.loginUrl,
  privateKey: config.privateKey,
  useRetry: false,
  issuer: 'urn:home-automation/alarm'
})
const motion = Bookshelf.Model.extend({
  tableName: 'motions',
  hasTimestamps: true,
  initialize: function () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('created', (model, attrs, options) => {
      const subject = config.motionDetectedSubject.replace(/{sensor_name}/, model.get('sensor_name'))
      const text = config.motionDetectedText.replace(/{sensor_name}/, model.get('sensor_name'))

      // alarm is armed.
      info('calling notification service. subject:', subject, 'test:', text)

      const {id, group_id} = options.by // eslint-disable-line camelcase
      return Promise
        .resolve(jwtGenerator.makeToken({
          subject,
          audience: 'urn:home-automation/notifications',
          payload: {id, group_id}
        }))
        .then(token => {
          function sendEmail (subject, text) {
            return request({
              url: url.resolve(config.notificationsUrl, 'emails'),
              method: 'POST',
              auth: {
                bearer: token
              },
              form: {
                subject: subject,
                text: text
              }
            })
          }

          function makeCall (text) {
            return request({
              url: url.resolve(config.notificationsUrl, 'calls'),
              method: 'POST',
              auth: {
                bearer: token
              },
              form: {
                text: text
              }
            })
          }

          function sendSms (text) {
            return request({
              url: url.resolve(config.notificationsUrl, 'sms'),
              method: 'POST',
              auth: {
                bearer: token
              },
              form: {
                subject: subject,
                text: text
              }
            })
          }

          return Promise.all([
            sendEmail(subject, text).catch(err => error('in sendEmail.  err:', err)),
            makeCall(text).catch(err => error('in makeCall.  err:', err)),
            sendSms(text).catch(err => error('in sendSms.  err:', err))
          ])
        })
        .catch(err => error('while sending email/sms/call.', err))
    })

    this.on('created', (model, attrs, options) => {
      verbose('sending message to client. group_id:', options.by.group_id)

      const {id, group_id} = options.by // eslint-disable-line camelcase
      return Promise
        .resolve(jwtGenerator.makeToken({
          subject: `Alarm motion created for group ${options.by.group_id}`,
          audience: 'urn:home-automation/alarm',
          payload: {id, group_id}
        }))
        .then((token) => {
          return Promise.all([
            publish({
              groupId: options.by.group_id,
              isTrusted: true,
              system: 'ALARM',
              type: 'MOTION_CREATED',
              payload: {},
              token,
              uuid: 'alarm-system-api'
            }),
            publish({
              groupId: options.by.group_id,
              isTrusted: false,
              system: 'ALARM',
              type: 'MOTION_CREATED',
              payload: {},
              token,
              uuid: 'alarm-system-api'
            })
          ])
        })
    })

    this.on('updating', () => {
      throw new Error('Motion cannot be changed after creation.')
    })
  }
})

motion.fetchLatest = (sensorName, options) =>
  motion.forge().query(qb => {
    qb.where('sensor_name', sensorName)
    qb.orderBy('created_at', 'DESC')
  }).fetch(options)

module.exports = motion
