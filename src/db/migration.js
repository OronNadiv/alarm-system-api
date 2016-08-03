import path from 'path'
import postgres from './postgres'
const configuration = {
  client: 'postgresql',
  connection: {
    database: postgres.connectionParameters.database,
    user: postgres.connectionParameters.user,
    password: postgres.connectionParameters.password,
    port: postgres.connectionParameters.port,
    host: postgres.connectionParameters.host,
    binary: postgres.connectionParameters.binary,
    ssl: postgres.connectionParameters.ssl,
    charset: 'utf8'
  },
  pool: {
    max: 1,
    min: 1
  },
  migrations: {
    directory: path.join(__dirname, 'migrations')
  }
}

export default {
  development: configuration,
  test: configuration,
  production: configuration
}
