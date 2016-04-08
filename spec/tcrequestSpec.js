"use strict";

var mockfs = require('mock-fs');
var tcrequest = require('../app/tcrequest');

describe('tcrequest', function() {

    beforeAll(function () {
        var jsonServer = require('json-server');
        var server = jsonServer.create();
        server.use(jsonServer.defaults());
        var router = jsonServer.router('specdb.json');
        server.use('/httpAuth/app/rest/', router);
        server.listen(8888);

        mockfs({
            conf: {
                'server.json': '{ "hostname": "localhost", "port" : 8888, "username": "admin", "password": "pass" }'
            }
        });
    });

    it('should read TC config from the server.json file', function() {
        var request = tcrequest.create("GET", "/http");
        expect(request.host).toBe('localhost');
        expect(request.port).toBe(8888);
        expect(request.auth).toBe("admin:pass");
        expect(request.method).toBe("GET");
        expect(request.path).toBe("/http");
    });

    it('should execute http request', function(done) {
        var request = tcrequest.create("GET", "/httpAuth/app/rest/test");
        request.execute(function(json) {
            expect(json).toEqual({ "result" : "success"});
            done();
        })
    });

    afterAll(function() {
        mockfs.restore();
    });

});

