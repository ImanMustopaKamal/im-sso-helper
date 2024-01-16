const appPath = require('./app-path')
module.exports = (config) => {
    const knex = require('knex')({
    client: config.database.client,
    connection: {
      host : config.database.host,
      port : config.database.port,
      user : config.database.username,
      password : config.database.password,
      database : config.database.name
    }
  })
  return knex
}