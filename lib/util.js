module.exports.dbId = function(conf){
  return `${conf.db.host}-${conf.db.database}`
}
