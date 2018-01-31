// load configuration by default load the one in conf, but if there is an argument use it
var conf = require('./conf/agile-db')
var mapping = require('./conf/action-mapping')
if (process.argv.length > 2) {
  conf = require(process.argv[2] + '/agile-db')
  mapping = require(process.argv[2] + '/action-mapping')
}
var DB = require('./mysql')
var agile = require('agile-sdk')(conf.sdk)
var Configurator = require('./configurator')
var db = new DB(conf.db)
var SQLParseConnector = require('./sqlparser')
var QueryEnforcer = require('./query-enforcer')
var parser = new SQLParseConnector(conf.sqlParser.host)
var bodyParser = require('body-parser')
var tokenParser = require('parse-bearer-token')
var express = require('express')
var app = express()
var log = require('winston')
console.log(`log level ${conf.log_level || 'info'}`)
log.level = conf.log_level || 'info'

// TOKEN=2tocgbK6TXEhB1aA66CPA7eo1JCg2E9BLhyz4BaUDZFJ3TBxqQ4sdJF6oE8fq1va
// #To execute a query without parameters do:
// curl -XPOST -d '{"query":"select * from user"}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query
// #To avoid SQL injections, if your application requires parameters in the query execute it like this:
// curl -XPOST -d '{"query":"select * from user where Host = ?", "values":["localhost"]}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query

app.post('/query/', bodyParser.json(), function (req, res) {
  log.debug(`result from tokenParser: ${tokenParser(req)}`)
  let token = tokenParser(req)
  if (token) {
    let agile = require('agile-sdk')(conf.sdk)
    agile.tokenSet(token)
    if (req.body && req.body.hasOwnProperty('query')) {
      let query = req.body.query
      if (req.body.hasOwnProperty('values')) {
        query = db.escapeQuery(query, req.body.values)
      }
      log.info(`finding out actions on tables from query : ${query}`)
      parser.parseQueryIntoActionsOnTables(query)
        .then((tablesAffected) => {
          log.info(`got the following tables affected from parsed query ${JSON.stringify(tablesAffected)}`)
          let enforcer = new QueryEnforcer(agile, conf, mapping)
          log.info(`calling the query enforcer to evaluate policy for tables affected`)
          return enforcer.evaluatePolicy(tablesAffected)
        }).then((decisionReadWrite) => {
          return db.execQuery(query)
        }).then((results) => {
          res.statusCode = 200
          res.json(results)
          log.debug(`results from query ${JSON.stringify(results, null, 2)}`)
        }).catch((err) => {
          log.error(err)
          var x = {error: 'unexpected problem ' + err}
          if (err.statusCode) {
            x.statusCode = err.statusCode
          } else {
            x.statusCode = 500
          }
          res.json(x)
        })
    } else {
      res.statusCode = 400
      log.info(`API called with a JSON body without a query attribute`)
      res.json({error: 'This API expects a JSON body with a query attribute'})
    }
  } else {
    res.statusCode = 401
    log.info(`API called without authorization header`)
    res.json({error: 'Provide an Authorization header with the bearer protocol including an authorization token'})
  }
})

// starting the server we need to check if the database is already in agile-security
agile.idm.authentication.authenticateClient(conf.client.id, conf.client.clientSecret).then((auth) => {
  agile.tokenSet(auth.access_token)
  return db.init()
}).then(() => {
  // this initializes the database in agile-security (IDM) if needed
  let configurator = new Configurator(agile, db, conf)
  return configurator.mapDB()
}).then(() => {
  app.listen(3005)
}).catch((err) => {
  log.error(err)
  return db.close()
}).then(() => {

}).catch((err) => {
  log.log('oops seems the db was closed already')
  log.error(err)
})
