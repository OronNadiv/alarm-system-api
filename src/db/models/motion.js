const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../../logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)
const error = log.error.bind(log, LOG_PREFIX)

import {createClient} from 'redis'
import Bookshelf from '../bookshelf'
import config from '../../config'
import emitter from 'socket.io-emitter'
import JWTGenerator from 'jwt-generator'
import Promise from 'bluebird'
import request from 'http-as-promised'
import url from 'url'

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
      let client = createClient(config.redisUrl)

      return Promise
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

export default motion
