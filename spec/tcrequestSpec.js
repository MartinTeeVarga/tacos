"use strict";

GLOBAL.taconf = {
    "hostname": "localhost",
    "port": 8888,
    "username": "admin",
    "password": "pass"
};

var mockfs = require('mock-fs');
var tcrequest = require('../app/tcrequest');
var nock = require('nock');

describe('tcrequest', function () {

    it('should read TC config from the server.json file', function () {
        var request = tcrequest.create("GET", "/http");
        expect(request.host).toBe('localhost');
        expect(request.port).toBe(8888);
        expect(request.auth).toBe("admin:pass");
        expect(request.method).toBe("GET");
        expect(request.path).toBe("/http");
    });

    it('should execute http request', function (done) {

        nock('http://localhost:8888')
            .get('/test')
            .reply(200, {
                "result": "success"
            });

        var request = tcrequest.create("GET", "/test");
        request.execute(function (result) {
            expect(result.status).toEqual(200);
            expect(result.data).toEqual({"result": "success"});
            done();
        });
    });

    it('should survive error while parsing json', function (done) {
        nock('http://localhost:8888')
            .get('/test')
            .reply(500, "Error");
        var request = tcrequest.create("GET", "/test");
        request.execute(function (result) {
            expect(result.status).toEqual(500);
            done();
        });

    });

    it('should send postdata', function (done) {
        nock('http://localhost:8888')
            .post('/test', {"postdata": "present"})
            .reply(200, {
                "result": "success"
            });
        var request = tcrequest.create("POST", "/test", '{"postdata": "present"}');
        request.execute(function (result) {
            expect(result.status).toEqual(200);
            done();
        });
    });

});

