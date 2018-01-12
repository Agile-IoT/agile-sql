module.exports = {
  db:{
    host: '172.17.0.1',
    user: 'root',
    password: 'root',
    database: 'mysql'
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
    host:'http://agile-sqlparser:8080/'
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
  ]
}
