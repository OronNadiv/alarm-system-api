const express = require('../../src/initializations/express')
const supertest = require('supertest')
const Promise = require('bluebird')

module.exports = Promise
  .try(express.initialize)
  .get('express')
  .then(supertest)
