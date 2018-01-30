const sequential = require('promise-sequential')
const axios = require('axios')
axios.defaults.headers.post['Content-Type'] = 'application/json'
var createError = require('http-errors')
var log = require('winston')

/**
 * Creates a new instance of ParserConnector.
 * This connector calls an external service to find out which SQL statements, e.g., SELECT, UPDATE, etc,
 * affect which tables
 * @constructor ParserConnector
 * @param {String} hostParser - URL to contact the external sql parsing service
 */
var ParserConnector = function (hostParser) {
  this.hostParser = hostParser
}

/**
* @summary This function parses a SQL query, in order to detech which tables are affected by which actions.
* This is the first step towards defining reading and writing policies on tables.

* @name parseQueryIntoActionsOnTables
* @public
* @function
* @memberof  ParserConnector
* @returns {Promise}
* @param {String} query -SQL Query
* @fulfil {Object}  and returns an object mapping the following keywords:
* DELETE, CREATE, MERGE, UPSERT, UPDATE, INSERT, REPLACE, SELECT to tables affected by them. For instance,
* if this function is called with a "SELECT * from User" query the following response is expected:
* {"DELETE":[],"CREATE":[],"MERGE":[],"UPSERT":[],"UPDATE":[],"INSERT":[],"REPLACE":[],"SELECT":["user"]}
* @example
* connector.parseQueryIntoActionsOnTables(query).then(function(results) {
*   console.log(results);
* });
**/
ParserConnector.prototype.parseQueryIntoActionsOnTables = function (query) {
  var that = this
  return new Promise(function (resolve, reject) {
    axios.post(that.hostParser, {query})
      .then(response => {
        if (response) {
          resolve(response.data)
        } else {
          reject(createError(500, 'reponse undefined from sql parser'))
        }
      })
      .catch(error => {
        log.error(error)
        reject(createError(response.status, error))
      })
  })
}

module.exports = ParserConnector
