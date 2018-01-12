
var util = require('./util')
var createError = require('http-errors');

var QueryEnforcer = function (agile, conf, mapping) {
  this.agile = agile
  this.dbId = util.dbId(conf)
  this.mapping = mapping
}



QueryEnforcer.prototype.evaluatePolicy = function(parseResults){
  var that = this;
  return new Promise(function (resolve, reject) {
    let query = []
    that.checkParseResults(parseResults).then((ops) =>{
      if(Object.keys(ops).length < 0){
        resolve()
      }
      else{
        Object.keys(ops).forEach((op)=>{
          let listOfTables = ops[op]
          listOfTables.forEach((name)=>{
            query.push({
              entityId: that.dbId,
              entityType: 'database',
              field:`actions.tables.${name}`,
              method: op
            })
          })
        })
        console.log(`pdp query is ${JSON.stringify(query)}`)
        return that.agile.policies.pdp.evaluate(query)
      }
    }).then((pdpRes)=>{
      console.log(`pdp query result is ${JSON.stringify(pdpRes)}`)
      let accumulator = true;
      pdpRes.forEach((value)=>{
        accumulator = accumulator && value
      })
      console.log(JSON.stringify(accumulator))
      if(accumulator){
        resolve()
      } else {
        reject(createError(403, "access denied"))
      }

    }).catch((error)=>{
      if(error.statusCode){
        reject(error)
      }
      else if(error.response && error.response.status && error.response.statusText){
        reject(createError(error.response.status, error.response.statusText))
      }
      else {
        console.log(`error in enforcer ${JSON.stringify(Object.keys(error))}`)
        reject(createError(500,error))
      }
    })
  })
}

QueryEnforcer.prototype.checkParseResults = function (parseResults) {
  var that = this
  return new Promise(function (resolve, reject) {
    let accumulator = {}
    Object.keys(parseResults).forEach((currentValue)=>{
      let done = false
      Object.keys(that.mapping).forEach((k)=>{
        if(that.mapping[k].indexOf(currentValue)>=0){
          done = true
          if(parseResults[currentValue].length>0 ){
            accumulator[k] = accumulator[k] || []
            accumulator[k] = accumulator[k].concat(parseResults[currentValue]);
          }
        }
      })
      if(!done){
        reject(createError(400, "unknown SQL keyword currentValue"+k))
      }
    })
    resolve(accumulator)
  })
}

module.exports = QueryEnforcer
