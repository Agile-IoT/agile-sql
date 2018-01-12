//load configuration by default load the one in conf, but if there is an argument use it
var conf = require('./conf/agile-db')
var mapping = require('./conf/action-mapping')
if(process.argv.length > 2){
  conf = require(process.argv[2]+'/agile-db')
  mapping = require(process.argv[2]+'/action-mapping')
}
var DB = require('./mysql')
var agile = require('agile-sdk')(conf.sdk)
var Configurator = require('./configurator')
var db = new DB(conf.db)
var SQLParseConnector = require('./sqlparser')
var QueryEnforcer = require('./query-enforcer')
var parser = new SQLParseConnector(conf.sqlParser.host)
var bodyParser = require('body-parser')
var tokenParser = require('parse-bearer-token');
var express = require('express')
var app = express();


//TOKEN=2tocgbK6TXEhB1aA66CPA7eo1JCg2E9BLhyz4BaUDZFJ3TBxqQ4sdJF6oE8fq1va
//curl -XPOST -d '{"query":"select * from user"}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query
app.post('/query/', bodyParser.json(), function (req, res) {
  console.log(tokenParser(req))
  let token = tokenParser(req)
  if(token){
    let agile = require('agile-sdk')(conf.sdk)
    agile.tokenSet(token)
    if(req.body && req.body.hasOwnProperty('query')){
      let query = req.body.query
      parser.parseQueryIntoActionsOnTables(query)
      .then((tablesAffected)=>{
        console.log(`got the following info from parsed query ${JSON.stringify(tablesAffected)}`)
        let enforcer = new QueryEnforcer(agile, conf, mapping)
        return enforcer.evaluatePolicy(tablesAffected)
      }).then((decisionReadWrite)=>{
        return db.execQuery(query)
      }).then((results) => {
        res.statusCode = 200;
        res.json(results);
        //console.log('results are: ', JSON.stringify(results, null, 2))
      }).catch((err) => {
        console.log('got error')
        console.log(err)
        var x = {error:"unexpected problem "+err}
        if(err.statusCode){
          x.statusCode = err.statusCode
        }
        else {
          x.statusCode = 500;
        }
        res.json(x)
      })
    } else {
      res.statusCode = 400;
      res.json({error:"This API expects a JSON body with a query attribute and "})
    }
  } else {
    res.statusCode = 401;
    res.json({error:"Provide an Authorization header with the bearer protocol including an authorization token"})
  }

});



//starting the server we need to check if the database is already in agile-security
agile.idm.authentication.authenticateClient(conf.client.id, conf.client.clientSecret).then((auth) => {
  agile.tokenSet(auth.access_token)
  return db.init()
 }).then(() => {
  //this initializes the database in agile-security (IDM) if needed
  let configurator = new Configurator(agile, db, conf)
  return configurator.mapDB()
}).then(()=>{
   app.listen(3005)
}).catch((err) => {
  console.log('got error')
  console.log(err)
  return db.close()
}).then(() => {

}).catch((err) => {
  console.log('oops seems the db was closed already')
})
