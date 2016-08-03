import path from 'path'
import config from '../config'

export default {
  // debug: true,
  client: 'pg',
  connection: config.postgres,
  pool: config.postgresPool,
  migrations: {
    directory: path.join(__dirname, '/migrations')
  }
}
