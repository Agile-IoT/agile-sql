var mysql = require('mysql')
var createError = require('http-errors')
var createIfNotExists = require('./conf/agile-db').createIfNotExists;
/**
 * Creates a new Mysql connection.
 * @constructor Mysql
 * @param {Object} conf - must include the connection confuration (host,user,password and database)
 */

var DB = function (conf) {
  this.conf = conf
}

/**
* @summary Initialize the connection to the mysql backend
* @name init
* @public
* @function
* @memberof Mysql
* @returns {Promise}
**/
DB.prototype.init = function () {
  var that = this
  return new Promise(function (resolve, reject) {
    if (!that.connection) {
      var dbConf = {}
      for(var key in that.conf) {
        if(that.conf.hasOwnProperty(key) && key !== 'database') {
          dbConf[key] = that.conf[key]
        }
      }
      that.connection = mysql.createConnection(dbConf)
      that.connection.connect()
      that.execQuery('USE ' + that.conf.database).then(data => {
        resolve();
      }).catch(err => {
        if(createIfNotExists && err.sqlMessage.includes('Unknown database')) {
          that.execQuery('CREATE DATABASE ' + that.conf.database).then(data => {
            that.execQuery('USE ' + that.conf.database)
            console.log('Successfully created database ' + that.conf.database)
            resolve();
          })
        }
      })
    }
  })
}

/**
* @summary Execute query on the backend. This function does not check policies, just executes SQL
* @name execQuery
* @public
* @function
* @memberof Mysql
* @returns {Promise}
* @param {String} query - SQL query
* @fulfil {Object} with results property containing an array of objects, where each object has the name of the column as key and the value of the row for that key as the value.
* For example if the table User in the example had two rows containing a user with name mark and email m@mk.com and another one called john with email john@jn.com the object
* returned when the promise resolves woul be: {results:[{name:'john', email:'john@hn.com'},{ name:'mark', email:' m@mk.com'}]}

* @example
* mysqlobject.execQuery('SELECT * FROM User').then(function(data) {
*   console.log(data.results);
* });
**/

DB.prototype.execQuery = function (query) {
  var that = this
  return new Promise(function (resolve, reject) {
    that.connection.query(query, function (error, results, fields) {
      if (error) {
        reject(createError(500, error))
      } else {
        resolve({results})
      }
    })
  })
}

/**
* @summary Build final query based on a statement and a list of values. This function does not check policies, just executes SQL
* @name escapeQuery
* @public
* @function
* @memberof Mysql
* @returns {Promise}
* @param {String} query - SQL query
* @param {Array} values - array with values to be replaced in the query with proper character escaping
* @returns {String} Final Query to be executed
* @example
* var query = mysqlobject.escapeQuery('UPDATE users SET foo = ?, bar = ? WHERE id = ?', ['fooarg', 1 , 'useridparam'])
* //prints UPDATE users SET foo = 'fooarg', bar = 1 WHERE id = 'useridparam'
* console.log(query);
**/

DB.prototype.escapeQuery = function (query, values) {
  return mysql.format(query, values)
}

/**
* @summary Gets all table names for the current database
* @name getAllTables
* @public
* @function
* @memberof Mysql
* @returns {Promise}
* @fulfil {Array} names - Strings representing names of tables
**/
DB.prototype.getAllTables = function () {
  var that = this
  return new Promise(function (resolve, reject) {
    that.connection.query('show tables', function (error, results, fields) {
      if (error) {
        reject(createError(500, error))
      } else {
        var res = results.map((row) => {
          return row.Tables_in_mysql
        })
        resolve(res)
      }
    })
  })
}

/**
* @summary closes the database connection synchronously
* @name close
* @public
* @function
* @memberof Mysql
**/
DB.prototype.close = function () {
  this.connection.end()
}

module.exports = DB
