/**
 * A module providing common functionalities for this application
 * @module utils
 */

/**
* This function builds a unique id based on the host and database name
*/
function dbId (conf) {
  if(conf.db.port) {
    return `${conf.db.host}-${conf.db.port}-${conf.db.database}`
  }
  return `${conf.db.host}-${conf.db.database}`
}

module.exports = {
  dbId
}
