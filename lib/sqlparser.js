const sequential = require('promise-sequential');
const axios = require('axios');
axios.defaults.headers.post['Content-Type'] = 'application/json';
var createError = require('http-errors');

var ParserConnector = function (hostParser) {
  this.hostParser = hostParser
}

ParserConnector.prototype.parseQueryIntoActionsOnTables = function (query) {
  var that = this
  return new Promise(function (resolve, reject) {
    axios.post(that.hostParser, {query})
      .then(response => {
        resolve(response.data)
      })
      .catch(error => {
        console.log(error)
        reject(createError(response.status, error))
      });
  })
}

module.exports = ParserConnector
