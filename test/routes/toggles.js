const should = require('should')
const path = require('path')
const Promise = require('bluebird')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const Factory = require('../factory')
const config = require('../../src/config')
const Request = require('./request')

const factory = Factory()
const shared = {}

let request

describe('Toggles route tests', () => {
  before(() => Promise.resolve(Request)
    .then(req => {
      request = req
    })
    .then(() => factory.create('user'))
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
    .then(user => factory.create('toggle', {is_armed: false, requested_by_id: user.id})))

  after(() => factory.cleanup())

  it(
    '/toggles get - should return recent toggles. last toggle is not armed',
    () =>
      request
        .get('/toggles')
        .set('Accept', 'application/json')
        .set('authorization', shared.token)
        .set('x-forwarded-proto', 'https')
        .send()
        .expect(200)
        .then(res => res.body[0].is_armed.should.be.equal(false))
  )

  it('/toggles post - should turn toggle to armed.', () =>
    request
      .post('/toggles')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .set('x-forwarded-proto', 'https')
      .send({is_armed: true})
      .expect(201)
      .then(res => res.body.should.eql({})))

  it('/toggles should return recent toggles. last toggle is armed', () =>
    request
      .get('/toggles')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(200)
      .then(res => {
        should.exist(res.body.length)
        res.body[0].is_armed.should.be.equal(true)
      }))
})
