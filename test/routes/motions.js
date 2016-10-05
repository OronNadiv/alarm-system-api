const should = require('should')
const path = require('path')
const Promise = require('bluebird')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const Chance = require('chance')
const Factory = require('../factory')
const config = require('../../src/config')
const Request = require('./request')

const chance = Chance()
const factory = Factory()
const sensorName = chance.name()
const shared = {}

let request
let time

describe('Motions route tests', () => {
  before(() => Promise.resolve(Request)
    .then(req => {
      request = req
    })
    .then(() => factory.create('user', {is_trusted: true}))
    .tap(user => {
      shared.user = user
      config.authPublicKey = fs.readFileSync(path.join(__dirname, '../keys/public_key.pem'))
      shared.token = `Bearer ${jwt.sign(user.toJSON(), fs.readFileSync(path.join(__dirname, '../keys/private_key.pem')), {
        algorithm: 'RS256',
        issuer: 'urn:home-automation/login',
        audience: 'urn:home-automation/*',
        subject: user.get('email'),
        expiresIn: 1000
      })}`
    })
    .then(() => factory.create('toggle', {is_armed: true, requested_by_id: shared.user.id}))
    .then(() => {
      return factory.create('motion', {
        sensor_name: sensorName
      })
    }))

  after(() => {
    return factory.cleanup()
  })

  it(
    '/motions get - should return recent motions. last motion is not detected',
    () => {
      return request
        .get('/motions')
        .set('Accept', 'application/json')
        .set('authorization', shared.token)
        .set('x-forwarded-proto', 'https')
        .send()
        .expect(200)
        .then(res => {
          res.body[0].should.be.ok()
          time = res.body[0].created_at
        })
    }
  )

  it('/motions post - should turn motion to detected.', () => {
    return request
      .post('/motions')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .set('x-forwarded-proto', 'https')
      .send({sensor_name: sensorName})
      .expect(201)
      .then(res => {
        res.body.should.eql({})
      })
  })

  it('/motions should return recent toggles. last motion is detected', () => {
    return request
      .get('/motions')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then(res => {
        should.exist(res.body.length)
        res.body[0].should.be.ok()
        res.body[0].created_at.should.not.equal(time)
      })
  })
})
