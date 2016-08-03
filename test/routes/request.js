import express from '../../initializations/express'
import supertest from 'supertest-as-promised'
import Promise from 'bluebird'

export default Promise
  .try(express.initialize)
  .get('express')
  .then(supertest)
