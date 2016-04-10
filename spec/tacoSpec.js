"use strict";

GLOBAL.taconf = {
    "hostname": "localhost",
    "port": 8888,
    "username": "admin",
    "password": "pass"
};

var taco = require('../app/taco');
var nock = require('nock');

describe("taco", function () {
    var socket, name, data;

    beforeEach(function () {
        socket = {
            emit: function (n, d) {
                name = n;
                data = d;
            }
        };
        spyOn(socket, 'emit');
    });

    it('should emit a list of agents', function (done) {
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/agents')
            .reply(200, {
                "count": 1,
                "href": "/httpAuth/app/rest/agents",
                "agent": [
                    {
                        "id": 1,
                        "name": "Bond",
                        "typeId": 1,
                        "href": "/httpAuth/app/rest/agents/id:1"
                    }
                ]
            });
        taco.getAgents(socket);
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith("server:agents", [
                {
                    "id": 1,
                    "name": "Bond",
                    "typeId": 1,
                    "href": "/httpAuth/app/rest/agents/id:1"
                }
            ]);
            done();
        }, 500);
    });

    it('should not list the same agent twice', function (done) {
        // this happens when one agent is both connected and disconnected due to a TC bug
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/agents')
            .reply(200, {
                "count": 2,
                "href": "/httpAuth/app/rest/agents",
                "agent": [
                    {
                        "id": 1,
                        "name": "Bond",
                        "typeId": 1,
                        "href": "/httpAuth/app/rest/agents/id:1"
                    },
                    {
                        "id": 1,
                        "name": "Bond",
                        "typeId": 1,
                        "href": "/httpAuth/app/rest/agents/id:1"
                    }
                ]
            });
        taco.getAgents(socket);
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith("server:agents", [
                {
                    "id": 1,
                    "name": "Bond",
                    "typeId": 1,
                    "href": "/httpAuth/app/rest/agents/id:1"
                }
            ]);
            done();
        }, 500);
    });

    it('should emmit error if list of agents not available', function (done) {
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/agents')
            .reply(403, "Forbidden");
        taco.getAgents(socket);
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith('server:error', 'agents');
            done();
        }, 500);
    });

    it('should emit a list of projects', function (done) {
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/projects')
            .reply(200, {
                "count": 2,
                "href": "/httpAuth/app/rest/projects",
                "project": [
                    {
                        "id": "_Root",
                        "name": "\<Root project\>"
                    },
                    {
                        "id": "Base",
                        "name": "Base"
                    }
                ]
            });
        taco.getProjects(socket);
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalled();
            done();
        }, 500);
    });

    it('should emmit error if list of projects not available', function (done) {
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/projects')
            .reply(403, "Forbidden");
        taco.getProjects(socket);
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith('server:error', 'projects');
            done();
        }, 500);
    });

    it('should queue builds', function (done) {
        nock('http://localhost:8888')
            .post('/httpAuth/app/rest/buildQueue', '<build personal="false"><buildType id="1"/></build>')
            .reply(200);
        taco.queue(socket, [{"id": 1, "name": "test"}], {});
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith('server:queued', 'test');
            done();
        }, 500);
    });

    it('should emit error when build cannot be queued', function (done) {
        nock('http://localhost:8888')
            .post('/httpAuth/app/rest/buildQueue')
            .reply(403);
        taco.queue(socket, [{"id": 1, "name": "test"}], {});
        setTimeout(function () {
            expect(socket.emit).toHaveBeenCalledWith('server:error', 'queue');
            done();
        }, 500);
    });

    it('should get build configs with all their details at once', function (done) {
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/projects/id:test/buildTypes')
            .reply(200, {
                "buildType": [
                    {"id": "bt1", "name": "build1"},
                    {"id": "bt2", "name": "build2"}
                ]
            });
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/buildTypes/id:bt1/branches?locator=policy:ACTIVE_HISTORY_AND_ACTIVE_VCS_BRANCHES')
            .reply(200, {"branch": [{"name": "master", "default": true}]});
        nock('http://localhost:8888')
            .get('/httpAuth/app/rest/buildTypes/id:bt2/branches?locator=policy:ACTIVE_HISTORY_AND_ACTIVE_VCS_BRANCHES')
            .reply(200, {"branch" : [{"name": "master", "default": true}, {"name": "dev"}]});
        taco.getBuilds(socket, "test");
        setTimeout(function () {
            expect(socket.emit.calls.argsFor(0)[0]).toBe('server:builds');
            expect(socket.emit.calls.argsFor(0)[1]).toEqual([
                {"id": "bt1", "name": "build1"},
                {"id": "bt2", "name": "build2"}
            ]);

            expect(socket.emit.calls.argsFor(1)[0]).toBe('server:branches');
            expect(socket.emit.calls.argsFor(1)[1]).toEqual([{"name": "master", "default": true}, {"name": "dev"}]);
            done();
        }, 500);
    });
});