module.exports = {
  up: (knex) => {
    return knex.schema.createTable('toggles', table => {
      table.increments('id').primary()
      table.integer('requested_by_id').notNullable()
        .references('id')
        .inTable('public.users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.bool('is_armed').notNullable()
      table.timestamps()
      table.index(['created_at'])
    })
  },
  down: (knex) => {
    return knex.schema.dropTable('toggles')
  }
}
