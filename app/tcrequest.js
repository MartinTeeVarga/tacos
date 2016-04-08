/**
 * Created by Martin Varga on 8/04/2016.
 */

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf/server.json', 'utf8'));

var Request = function (method, path) {
    this.host = conf.hostname;
    this.port = conf.port;
    this.auth = conf.username + ':' + conf.password;
    this.headers = {
        'Content-type': 'application/xml',
        'Accept': 'application/json'
    };
    this.method = method;
    this.path = path;
};

module.exports.create = function (method, path) {
    return new Request(method, path)
};