"use strict";

var http = require('http');

var Request = function (method, path, postdata) {
    this.host = taconf.hostname;
    this.port = taconf.port;
    this.auth = taconf.username + ':' + taconf.password;
    this.headers = {
        'Content-type': 'application/xml',
        'Accept': 'application/json'
    };
    this.method = method;
    this.path = path;
    this.postdata = postdata;

    this.execute = function (callback) {
        var req = http.request(this, function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                var data;
                try {
                    data = JSON.parse(body);
                } catch (e) {
                    data = body;
                }
                callback({
                    "status": response.statusCode,
                    "data": data
                });
            });
        });
        if (postdata) {
            req.write(postdata);
        }
        req.end();
    }
};

module.exports.create = function (method, path, postdata) {
    return new Request(method, path, postdata)
};

