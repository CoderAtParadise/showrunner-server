const knex = require('knex') ({
  client: 'mysql',
  connection: {
    host: 'db',
    port: 3306,
    user: 'showrunner',
    password: 'showrunner',
    database: 'showrunner'
  }
});


knex.schema
.createTable('templates', table => {
  table.string('id').primary().notNullable();
  table.json('data').notNullable();
})
.createTable('runsheets',table => {
  table.uuid('id').primary().notNullable();
  table.string('template').notNullable();
  //table.foreign('template').references('templates.id');
  table.string('location').notNullable();
  table.string('show').notNullable();
  table.date('from');
  table.date('to');
  table.string('title').notNullable();
  table.string('subtitle');
  table.json('data').notNullable();
  table.boolean('dirty').notNullable().defaultTo(true);
  table.dateTime('expires');
  table.json('cache');
})
.then(() => 
  knex('templates').insert({id: "default",data: {template: {}}})
)
.then(result => {
  //DO nothing
})
.catch(e => {
  console.error(e);
});

module.exports = (req,res,next) => {
  req.db = knex;
  next();
}