const verbose = require('debug')('ha:db:models:motion:verbose')
const info = require('debug')('ha:db:models:motion:info')
const error = require('debug')('ha:db:models:motion:error')

const createClient = require('redis')
const Bookshelf = require('../bookshelf')
const config = require('../../config')
const emitter = require('socket.io-emitter')
const JWTGenerator = require('jwt-generator')
const Promise = require('bluebird')
const request = require('http-as-promised')
const url = require('url')

const md5 = require('md5')
const PubNub = require('pubnub')
const {publishKey, subscribeKey} = config.pubNub

const jwtGenerator = new JWTGenerator(config.loginUrl, config.privateKey, false, 'urn:home-automation/alarm')
const motion = Bookshelf.Model.extend({
  tableName: 'motions',
  hasTimestamps: true,
  initialize: function () {
    this.on('saving', (model, attrs, options) => {
      model.set('group_id', options.by.group_id)
    })

    this.on('created', (model, attrs, options) => {
      const subject = config.motionDetectedSubject.replace(/\{sensor_name}/, model.get('sensor_name'))
      const text = config.motionDetectedText.replace(/\{sensor_name}/, model.get('sensor_name'))

      // alarm is armed.
      info('calling notification service. subject:', subject, 'test:', text)

      return Promise
        .resolve(jwtGenerator.makeToken(subject, 'urn:home-automation/notifications', options.by))
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

      let client = createClient(config.redisUrl)

      const p1 = Promise
        .try(() => {
          verbose('sending message to client. group_id:', options.by.group_id)

          const io = emitter(client)
          io.of(`/${options.by.group_id}`).to('sirens').emit('MOTION_CREATED')
        })
        .catch(err => error('While calling socket io /sirens', err))
        .finally(() => {
          if (client) {
            client.quit()
            client = null
          }
        })

      const p2 = new Promise((resolve, reject) => {
        const authKey = md5(options.by.token)
        const publisher = new PubNub({
          publishKey,
          subscribeKey,
          authKey,
          ssl: true
        })

        const publishConfig = {
          message: {
            system: 'ALARM',
            type: 'MOTION_CREATED',
            payload: model.toJSON()
          },
          channel: `${options.by.group_id}-trusted`
        }
        publisher.publish(publishConfig, (status) => {
          switch (status.statusCode) {
            case 200:
              info('Publish complete successfully.',
                'Hashed authKey:', md5(authKey))
              return resolve()
            default:
              error('Publish failed.',
                'Hashed authKey:', md5(authKey),
                'status:', status)
              reject(status)
          }
        })
      })

      return Promise.all([p1, p2])
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
