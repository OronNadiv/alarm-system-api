import {Factory} from 'factory-girl'
import BookshelfAdapter from 'factory-girl-bookshelf'
import Chance from 'chance'
import motion from './factories/motion'
import Promise from 'bluebird'
import toggle from './factories/toggle'
import user from './factories/user'
import 'should'

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

export default () => {
  const factory = new Factory()

  factory.setAdapter(new BookshelfAdapter())
  factory.chance = chance
  motion(factory)
  toggle(factory)
  user(factory)

  return factory.promisify(Promise)
}
