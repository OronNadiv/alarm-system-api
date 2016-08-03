import Ack from '../models/ack'
import Bookshelf from '../bookshelf'

export default Bookshelf.Collection.extend({
  tableName: 'acks',
  model: Ack,
  fetch: function (options) {
    this.query(qb => {
      qb.orderBy('updated_at', 'DESC')
    })
    return Bookshelf.Collection.prototype.fetch.call(this, options)
  }
})
