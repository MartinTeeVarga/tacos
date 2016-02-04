/**
 * Created by Martin Varga on 21/10/2015.
 */
var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf/server.json', 'utf8'));

var io = require('socket.io')(server);

app.use(express.static('public'));

var Request = function (method, path) {
    this.host = conf.hostname,
        this.port = conf.port,
        this.auth = conf.username + ':' + conf.password,
        this.headers = {
            'Content-type': 'application/xml',
            'Accept': 'application/json'
        }
    this.method = method;
    this.path = path;
};

function queueAllBuilds(builds, branch, personal, agentId) {
    for (var i = 0; i < builds.length; i++) {
        var id = builds[i].id;
        if (id.indexOf('All') != 0) {
            console.log("Queueing " + builds[i].name + " as personal? " + personal + " on agent " + agentId);
            var postData = '<build personal="' + personal + '" branchName="' + branch + '">' +
                '<buildType id="' + id + '"/>';

            if (agentId) {
                postData += '<agent id="' + agentId + '"/>'
            }

            postData += '</build>';

            // Set up the request
            var queueRequest = new Request('POST', '/httpAuth/app/rest/buildQueue');
            var request = http.request(queueRequest, function (response2) {
                // print something maybe
            });

            // post the data
            request.write(postData);
            request.end();
        }
    }
}

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

function getProjects(socket) {
    var request = new Request('GET', '/httpAuth/app/rest/projects');
    execute(request, function (json) {
        var projects = json.project.filter(function (item) {
            return !item.archived;
        });
        socket.emit('server:projects', projects);
    });
}

function getAgents(socket) {
    var request = new Request('GET', '/httpAuth/app/rest/agents');
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

io.on('connection', function (socket) {
    getProjects(socket);
    getAgents(socket);

    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('gui:branches', function (obj) {
        socket.emit('server:branches', [
            {
                'id': 'dev',
                'name': 'dev'
            },
            {
                'id': 'master',
                'name': 'master'
            }
        ])
    });

    socket.on('gui:queue', function (obj) {
        var request = new Request('GET', '/httpAuth/app/rest/projects/id:' + obj.project + '/buildTypes');
        execute(request, function (json) {
            queueAllBuilds(json.buildType, obj.branch, obj.personal, obj.agentId);
            socket.emit('server:done');
        });
    });
});

server.listen(8080, function () {
    console.log('listening on *:8080');
});