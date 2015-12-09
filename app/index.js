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

var listRequest = {
    host: conf.hostname,
    port: conf.port,
    path: '/httpAuth/app/rest/projects/name:RippleDown/buildTypes',
    method: 'GET',
    auth: conf.username + ':' + conf.password,
    headers: {'Accept': 'application/json'}
};

var queueRequest = {
    host: conf.hostname,
    port: conf.port,
    path: '/httpAuth/app/rest/buildQueue',
    method: 'POST',
    auth: conf.username + ':' + conf.password,
    headers: {
        'Content-type': 'application/xml',
        'Accept': 'application/json'
    }

};

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    function queueAllBuilds(builds, branch) {
        for (var i = 0; i < builds.length; i++) {
            var id = builds[i].id;
            if (id.indexOf('All') != 0) {
                console.log("Queueing " + builds[i].name);
                var postData = '<build personal="true" branchName="' + branch + '"><buildType id="' + id + '"/></build>';

                // Set up the request
                var request = http.request(queueRequest, function (response2) {
                    // print something maybe
                });

                // post the data
                request.write(postData);
                request.end();
            }
        }
    }

    socket.on('gui:queue', function (obj) {
        http.request(listRequest, function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                var listRequestBodyAsJSON = JSON.parse(body);

                var builds = listRequestBodyAsJSON.buildType;

                queueAllBuilds(builds, obj.branch);

                io.emit('done', body);
            });
        }).end();
    });

});

server.listen(8080, function () {
    console.log('listening on *:8080');
});