var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var taco = require('./taco');
var io = require('socket.io')(server);
var fs = require('fs');
GLOBAL.taconf = JSON.parse(fs.readFileSync('conf/server.json', 'utf8'));

app.use(express.static('public'));

io.on('connection', function (socket) {
    console.log('a user connected');
    taco.getProjects(socket);
    taco.getAgents(socket);

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('gui:builds', function (obj) {
       taco.getBuilds(socket, obj.projectId);
    });

    socket.on('gui:agents', function (obj) {
       taco.getAgents(socket);
    });

    socket.on('gui:queue', function (obj) {
        console.log("QUEUE");
        taco.queue(socket, obj.builds, obj.parameters);
    });
});

server.listen(8080, function () {
    console.log('listening on *:8080');
});