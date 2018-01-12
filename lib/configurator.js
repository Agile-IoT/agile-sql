var sequential = require('promise-sequential');
var util = require('./util')
var createError = require('http-errors');

var Configurator = function (agile, db, conf) {
  this.agile = agile
  this.db = db
  this.conf = conf
}

Configurator.prototype.mapDB = function () {
  var that = this
  let agile = this.agile
  let db = this.db
  let conf = this.conf
  return new Promise(function (resolve, reject) {
    let id = util.dbId(conf)
    let tablesThere = false
    /*agile.idm.entity.delete(id, 'database')
    .catch((err)=>{
      console.log('error while removing '+err)
      return agile.idm.entity.get(id, 'database');
    }).then(()=>{
      console.log('REMOVED!!!!')
      return agile.idm.entity.get(id, 'database');
    }).then((entity)=>{*/
    agile.idm.entity.get(id, 'database').then((entity) => {
      console.log(`db entity found ${JSON.stringify(entity)}`)
      tablesThere = true
      return Promise.resolve(entity);
    }).catch((err) => {
      console.log(`database not registered in idm putting db with id ${id} as ${JSON.stringify(conf.db)}`)
      return agile.idm.entity.create(id, 'database', conf.db)
    }).then((entity) => {
      if(tablesThere){
        return Promise.resolve([])
      } else{
        console.log(`listing tables to create them in agile-security`)
        return db.getAllTables()
      }
    }).then((names) => {
      if(names.length ==0){
        return Promise.resolve([])
      } else {
        console.log('tables found in db are: ', JSON.stringify(names))
        let setting = []
        names.forEach((name)=>{
          setting.push(() =>
            agile.policies.pap.set({
            entityId : id,
            entityType: 'database',
            field : `actions.tables.${name}`,
            policy: conf.tablePolicy
            })
          )
        })
        console.log('starting to execute the pap updates on actions.tables')
        return sequential(setting)
      }
    }).then((values)=>{
      console.log('done with the pap updates on actions.tables if they were needed')
      resolve()
    }).catch((error)=>{
      if(error.statusCode){
        reject(error)
      }
      else {
        reject(createError(500,error))
      }
    });
  })
}

module.exports = Configurator
