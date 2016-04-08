var fs = require('fs');
var http = require('http');

var conf;

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

    this.execute = function (callback) {
        http.request(this, function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                var json = JSON.parse(body);
                callback(json);
            });
        }).end();
    }
};

module.exports.create = function (method, path) {
    if (conf == undefined) {
        conf = JSON.parse(fs.readFileSync('conf/server.json', 'utf8'));
    }
    return new Request(method, path)
};

