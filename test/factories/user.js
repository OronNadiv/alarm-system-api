import Model from '../../db/models/user'

export default factory => {
  factory.define('user', Model, {
    name: factory.chance.word(),
    email: factory.chance.email(),
    password_hash: factory.chance.word(),
    is_active: factory.chance.bool()
  })
}
