import path from 'path'
import Promise from 'bluebird'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import Factory from '../factory'
import config from '../../config'
import Request from './request'

const factory = Factory()
const shared = {}

let request

describe('Home route tests', () => {
  before(() => {
    config.production = true
    return Promise.resolve(Request)
      .then(req => {
        request = req
      })
      .then(() => factory.create('user'))
      .then(user => {
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
  })

  after(() => {
    config.production = false
    return factory.cleanup()
  })

  it('/ -https -token should get 302 to https', () =>
    request
      .get('/')
      .set('Accept', 'application/json')
      .send()
      .expect(302)
      .then(res => res.headers.location.should.equal(config.uiUrl)))

  it('/test -https -token should get 302 to https', () =>
    request
      .get('/test')
      .set('Accept', 'application/json')
      .send()
      .expect(302)
      .then(res => res.headers.location.should.startWith('https://')))

  it('/test +https -token should get 401', () =>
    request
      .get('/test')
      .set('Accept', 'application/json')
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(401))

  it('/test -https +token should get 302 to https', () =>
    request
      .get('/test')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .send()
      .expect(302)
      .then(res => res.headers.location.should.startWith('https://')))

  it('/test +https +token should get 404', () =>
    request
      .get('/test')
      .set('Accept', 'application/json')
      .set('authorization', shared.token)
      .set('x-forwarded-proto', 'https')
      .send()
      .expect(404))
})
