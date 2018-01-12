var mysql = require('mysql')
var createError = require('http-errors');

var DB = function (conf) {
  this.conf = conf
}

DB.prototype.init = function () {
  var that = this
  return new Promise(function (resolve, reject) {
    if (!that.connection) {
      that.connection = mysql.createConnection(that.conf)
      that.connection.connect()
    }
    resolve()
  })
}

DB.prototype.execQuery = function (query) {
  var that = this
  return new Promise(function (resolve, reject) {
    that.connection.query(query, function (error, results, fields) {
      if (error) {
        reject(createError(500,error))
      } else {
        resolve({ results})
      }
    })
  })
}

DB.prototype.getAllTables = function () {
  var that = this
  return new Promise(function (resolve, reject) {
    that.connection.query('show tables', function (error, results, fields) {
      if (error) {
        reject(createError(500,error))
      } else {
        var res = results.map((row) => {
          return row.Tables_in_mysql
        })
        resolve(res)
      }
    })
  })
}

DB.prototype.close = function () {
  this.connection.end()
}

module.exports = DB

/* connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
}); */
