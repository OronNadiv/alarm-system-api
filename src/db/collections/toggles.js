import Promise from 'bluebird'
import Bookshelf from '../bookshelf'
import config from '../../config'
import Toggle from '../models/toggle'

const toggles = Bookshelf.Collection.extend({
  tableName: 'toggles',
  model: Toggle
})

toggles.purge = () => {
  const second = 1000
  const minute = second * 60
  const hour = minute * 60
  const day = hour * 24

  setInterval(() => {
    Promise
      .try(() => toggles.forge().query(qb => {
        const d = new Date()
        d.setDate(d.getDate() - config.keepHistoryInDays)
        qb.where('created_at', '<', d)
      }).fetch())
      .get('models')
      .map(model => model.destroy())
  }, day)
}

export default toggles
