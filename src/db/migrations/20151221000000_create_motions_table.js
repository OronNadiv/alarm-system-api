export const up = knex => {
  return knex.schema.createTable('motions', table => {
    table.increments('id').primary()
    table.string('sensor_name').notNullable()
    table.timestamps()
  })
}

export const down = knex => {
  return knex.schema.dropTable('motions')
}
