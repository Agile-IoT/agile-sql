/**
 * A module providing common functionalities for this application
 * @module utils
 */

/**
* This function builds a unique id based on the host and database name
*/
function dbId (conf) {
  return `${conf.db.host}-${conf.db.port || 3306}-${conf.db.database}`
}

module.exports = {
  dbId
}
