import Bookshelf from '../bookshelf'
import '../../config'

export default Bookshelf.Model.extend({
  tableName: 'public.users',
  hasTimestamps: true,
  hidden: ['password_hash', 'failed_login_attempts', 'email'],

  format (attrs) {
    if (attrs.email) {
      attrs.email = attrs.email.toLowerCase().trim()
    }

    return attrs
  }
})
