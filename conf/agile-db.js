module.exports = {
  db:{
    host: 'sql-db',
    user: 'root',
    port: 3306,
    password: 'root',
    database: 'agile'
  },
  client: {
    "id": "mysqlDB",
    "clientSecret": "Ultrasecretstuff"
  },
  sdk:{
    token:'',
    api: 'http://agile-core:8080',
    idm: 'http://agile-security:3000'
  },
  sqlParser:{
    host:'http://sql-parser:9123/'
  },
  log_level:'info',
  tablePolicy:[
    {
      op: "write",
      locks: [{
        lock: "hasType",
        args: ["/user"]
      }, {
        lock: "isOwner"
      }]
    },
    {
      op: "read",
      locks: [{
        lock: "hasType",
        args: ["/user"]
      }, {
        lock: "isOwner"
      }]
    }
  ],
  createIfNotExists: true
}
