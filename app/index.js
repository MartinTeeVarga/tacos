/**
 * Created by Martin Varga on 21/10/2015.
 */
var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

var tcrequest = require('./tcrequest');

var io = require('socket.io')(server);

app.use(express.static('public'));

function execute(request, callback) {
    http.request(request, function (response) {
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

function queueAllBuilds(builds, branch, personal, agentId) {
    for (var i = 0; i < builds.length; i++) {
        var id = builds[i].id;
        var postData = '<build personal="' + personal + '" ';
        console.log(">> " + branch);
        if (!branch.default) {
            postData += 'branchName="' + branch.name + '" ';
        }
        postData += '>' +
            '<buildType id="' + id + '"/>';

        if (agentId) {
            postData += '<agent id="' + agentId + '"/>'
        }

        postData += '</build>';
        console.log("Queueing " + builds[i].name + " as personal? " + personal + " on agent " + agentId + ": " + postData);

        // Set up the request
        var queueRequest = tcrequest.create('POST', '/httpAuth/app/rest/buildQueue');
        var request = http.request(queueRequest, function (response2) {
            // print something maybe
        });

        // post the data
        request.write(postData);
        request.end();
    }
}

function getProjects(socket) {
    var request = tcrequest.create('GET', '/httpAuth/app/rest/projects');
    execute(request, function (json) {
        var projects = json.project.filter(function (item) {
            return !item.archived;
        });
        socket.emit('server:projects', projects);
    });
}

function getConfigs(socket, obj) {
    var request = tcrequest.create('GET', '/httpAuth/app/rest/projects/id:' + obj.project + '/buildTypes');
    execute(request, function (json) {
        socket.emit('server:configs', json.buildType);
        json.buildType.forEach(function (build) {
            var branchesRequest = tcrequest.create('GET', '/httpAuth/app/rest/buildTypes/id:' + build.id + "/branches?locator=policy:ACTIVE_HISTORY_AND_ACTIVE_VCS_BRANCHES");

            execute(branchesRequest, function (detailsJson) {
                socket.emit('server:branches', detailsJson.branch);
            });
        });
    });
}

function getAgents(socket) {
    var request = tcrequest.create('GET', '/httpAuth/app/rest/agents');
    execute(request, function (json) {
        var distinct = [];
        var agents = json.agent.filter(function (item) {
            if (distinct.indexOf(item.id) < 0) {
                distinct.push(item.id);
                return true;
            } else {
                return false;
            }
        });
        socket.emit('server:agents', agents);
    });
}

function queue(socket, obj) {
    var request = tcrequest.create('GET', '/httpAuth/app/rest/projects/id:' + obj.project + '/buildTypes');
    execute(request, function (json) {
        queueAllBuilds(json.buildType, obj.branch, obj.personal, obj.agentId);
        socket.emit('server:done');
    });
}

io.on('connection', function (socket) {
    getProjects(socket);
    getAgents(socket);

    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('gui:configs', function (obj) {
        getConfigs(socket, obj);
    });

    socket.on('gui:queue', function (obj) {
        queue(socket, obj);
    });
});

server.listen(8080, function () {
    console.log('listening on *:8080');
});