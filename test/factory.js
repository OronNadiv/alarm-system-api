const Factory = require('factory-girl').Factory
const BookshelfAdapter = require('factory-girl-bookshelf')
const Chance = require('chance')
const motion = require('./factories/motion')
const Promise = require('bluebird')
const toggle = require('./factories/toggle')
const user = require('./factories/user')
require('should')

const chance = new Chance()

BookshelfAdapter.prototype.build = (Model, props) => new Model(props)

BookshelfAdapter.prototype.save = (doc, Model, cb) => {
  const options = {method: 'insert'}
  return doc.save({}, options).nodeify(cb)
}

BookshelfAdapter.prototype.destroy = (doc, Model, cb) => {
  if (!doc.id) {
    return process.nextTick(cb)
  }
  return doc.destroy().nodeify(cb)
}

module.exports = () => {
  const factory = new Factory()

  factory.setAdapter(new BookshelfAdapter())
  factory.chance = chance
  motion(factory)
  toggle(factory)
  user(factory)

  return factory.promisify(Promise)
}
