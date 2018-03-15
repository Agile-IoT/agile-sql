var sequential = require('promise-sequential')
var util = require('./util')
var createError = require('http-errors')
var log = require('winston')

/**
 * Creates a new instance of a Configurator.
 * This object is capable of inspecting an existing database, and registering it to
 * agile-security
 * @constructor Configurator
 * @param {Object} agile - sdk object to register the database entity and its default policies in agile-security
 * @param {Object} db - instance of Mysql object, used to list all the tables in order to register them in agile
 * @param {Object} conf - object with the  client key. under the client key an object containing a valid
 * client id and clientSecret is needed. As this information is used to retrieve a token from agile-security and
 * then register all the tables through this client, i.e., on behalf of the client's owner.
 * Also the conf object should have a "tablePolicy" key under which the INITIAL default policy for EVERY table is specified.
 */
var Configurator = function (agile, db, conf) {
  this.agile = agile
  this.db = db
  this.conf = conf
}

/**
* @summary This function queries the sql database and registers all the tables with the default policies.
* The default policy comes from the configuration object provided during creation
* @name mapDB
* @public
* @function
* @memberof Configurator
* @returns {Promise}
* @fulfil {void} resolves without an argument
* @example
* configurator.mapDB().then(function() {
*   console.log();
* });
**/
Configurator.prototype.mapDB = function () {
  let agile = this.agile
  let db = this.db
  let conf = this.conf
  return new Promise(function (resolve, reject) {
    let id = util.dbId(conf)
    let tablesThere = false
    /* agile.idm.entity.delete(id, 'database')
    .catch((err)=>{
      console.log('error while removing '+err)
      return agile.idm.entity.get(id, 'database');
    }).then(()=>{
      console.log('REMOVED!!!!')
      return agile.idm.entity.get(id, 'database');
    }).then((entity)=>{ */
    agile.idm.entity.get(id, 'database').then((entity) => {
      console.log(`db entity found ${JSON.stringify(entity)}`)
      tablesThere = true
      return Promise.resolve(entity)
    }).catch((err) => {
      log.debug(`this may be ok. It seems the database is not there ${err}`)
      log.info(`database not registered in idm putting db with id ${id} as ${JSON.stringify(conf.db)}`)
      return agile.idm.entity.create(id, 'database', conf.db)
    }).then((entity) => {
      if (tablesThere) {
        return Promise.resolve([])
      } else {
        log.info(`listing tables to create them in agile-security`)
        return db.getAllTables()
      }
    }).then((names) => {
      if (names.length === 0) {
        return agile.policies.pap.set({
          entityId: id,
          entityType: 'database',
          field: `actions.tables`,
          policy: conf.tablePolicy
        })
      } else {
        log.info('tables found in db are: ', JSON.stringify(names))
        let setting = []
        //set top level for policies in tables
        setting.push(() =>
          agile.policies.pap.set({
            entityId: id,
            entityType: 'database',
            field: `actions.tables`,
            policy: conf.tablePolicy
          })
        )
        names.forEach((name) => {
          setting.push(() =>
            agile.policies.pap.set({
              entityId: id,
              entityType: 'database',
              field: `actions.tables.${name}`,
              policy: conf.tablePolicy
            })
          )
        })
        log.info('starting to execute the pap updates on actions.tables')
        return sequential(setting)
      }
    }).then((values) => {
      log.info('done with the pap updates on actions.tables if they were needed')
      resolve()
    }).catch((error) => {
      if (error.statusCode) {
        reject(error)
      } else {
        reject(createError(500, error))
      }
    })
  })
}

Configurator.prototype.mapTable = function (tables) {
  let agile = this.agile
  let db = this.db
  let conf = this.conf
  return new Promise(function (resolve, reject) {
    let id = util.dbId(conf)
    agile.idm.entity.get(id, 'database').then((entity) => {
      console.log(`db entity found ${JSON.stringify(entity)}`)
      return Promise.resolve(entity)
    }).catch((err) => {
      log.debug(`this may be ok. It seems the database is not there ${err}`)
      log.info(`database not registered in idm putting db with id ${id} as ${JSON.stringify(conf.db)}`)
      return agile.idm.entity.create(id, 'database', conf.db)
    }).then((entity) => {
        log.info(`listing tables to create them in agile-security`)
        return db.getAllTables()
    }).then((names) => {
      if (names.length === 0) {
        return Promise.resolve([])
      } else {
        log.info('tables found in db are: ', JSON.stringify(names))
        let setting = []
        tables.forEach(table => {
          if(names.includes(table)) {
            log.info(`Table exists - set policy for table ${table}`)
            setting.push(() =>
              agile.policies.pap.set({
                entityId: id,
                entityType: 'database',
                field: `actions.tables.${table}`,
                policy: conf.tablePolicy
              })
            )
          }
        })
        log.info('starting to execute the pap updates on actions.tables')
        return sequential(setting)
      }
    }).then((values) => {
      log.info(`done with the pap updates on actions.tables.${tables} if they were needed`)
      resolve()
    }).catch((error) => {
      if (error.statusCode) {
        reject(error)
      } else {
        reject(createError(500, error))
      }
    })
  })
}


module.exports = Configurator
