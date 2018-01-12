module.exports = {
  db:{
    host: 'localhost',
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
    host:'http://localhost:8080/'
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
