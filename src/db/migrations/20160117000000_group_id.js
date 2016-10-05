module.exports = {
  up: (knex, Promise) => {
    return knex.transaction(trx =>
      Promise
        .resolve(
          trx.schema.table('toggles', table => {
            table.integer('group_id').notNullable()
              .references('id')
              .inTable('public.groups')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
          }))
        .then(() => trx.raw('ALTER TABLE toggles ALTER COLUMN group_id DROP DEFAULT;'))
        .then(() =>
          trx.schema.table('acks', table => {
            table.integer('group_id').notNullable()
              .references('id')
              .inTable('public.groups')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
          }))
        .then(() => trx.raw('ALTER TABLE acks ALTER COLUMN group_id DROP DEFAULT;'))
        .then(() =>
          trx.schema.table('motions', table => {
            table.integer('group_id').notNullable()
              .references('id')
              .inTable('public.groups')
              .onDelete('CASCADE')
              .onUpdate('CASCADE')
          }))
        .then(() => trx.raw('ALTER TABLE motions ALTER COLUMN group_id DROP DEFAULT;'))
    )
  },
  down: (knex) => {
    return knex.transaction(trx => {
      return Promise
        .resolve(trx.schema.table('toggles', table => {
          table.dropColumn('group_id')
        }))
        .then(() => {
          return trx.schema.table('acks', table => {
            table.dropColumn('group_id')
          })
        })
        .then(() => {
          return trx.schema.table('motions', table => {
            table.dropColumn('group_id')
          })
        })
    })
  }
}
