export const up = knex => {
  return knex.schema.createTable('acks', table => {
    table.increments('id').primary()
    table.string('sensor_name').notNullable().unique().index()
    table.timestamps()
  })
}

export const down = knex => {
  return knex.schema.dropTable('acks')
}
