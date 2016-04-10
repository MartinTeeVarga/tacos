"use strict";
var tc = require('./tcrequest');
var _ = require('lodash');

module.exports.getAgents = function (socket) {
    var request = tc.create('GET', '/httpAuth/app/rest/agents');
    request.execute(function (result) {
        if (result.status == 200) {
            var distinct = [];
            var agents = _.uniqBy(result.data.agent, function(a) {
                return a.id;
            });
            socket.emit('server:agents', agents);
            socket.emit('server:agents', agents);
        } else {
            socket.emit('server:error', 'agents');
        }
    });
};

module.exports.getProjects = function (socket) {
    var request = tc.create('GET', '/httpAuth/app/rest/projects');
    request.execute(function (result) {
        if (result.status == 200) {
            var projects = result.data.project.filter(function (item) {
                return !item.archived;
            });
            socket.emit('server:projects', projects);
        } else {
            socket.emit('server:error', 'projects')
        }
    });
};

module.exports.getBuilds = function(socket, projectId) {
    var request = tc.create('GET', '/httpAuth/app/rest/projects/id:' + projectId + '/buildTypes');
    request.execute(function (result) {
        var buildTypes = result.data.buildType;
        socket.emit("server:builds", buildTypes);
        var branches = [];
        var gotBranches = _.after(buildTypes.length, function() {
            branches = _.uniqBy(branches, function (b) {
                return b.name;
            });
            socket.emit('server:branches', branches);
        });
        for (var i = 0; i < buildTypes.length; i++) {
            var branchRequest = tc.create("GET", '/httpAuth/app/rest/buildTypes/id:' + buildTypes[i].id + '/branches?locator=policy:ACTIVE_HISTORY_AND_ACTIVE_VCS_BRANCHES');
            branchRequest.execute(function(branchResult) {
                branches = branches.concat(branchResult.data.branch);
                gotBranches();
            });
        }
    });
};

module.exports.queue = function (socket, builds, parameters) {
    console.log("DO");
    for (var i = 0; i < builds.length; i++) {
        console.log("NOW: ");
        var id = builds[i].id;
        var postData = createPostData(id, parameters);
        // Set up the request
        var queueRequest = tc.create('POST', '/httpAuth/app/rest/buildQueue', postData);
        var name = builds[i].name;
        console.log("Q:" + name + " p:" + parameters.personal + " a: " + parameters.agentId + "; " + postData);

        (function (immutable) {
            queueRequest.execute(function (queueResponse) {
                if (queueResponse.status == 200) {
                    socket.emit('server:queued', immutable);
                } else {
                    socket.emit('server:error', "queue");
                }
            })
        })(name);
    }
};
//TODO test this for defaults etc
function createPostData(id, parameters) {
    var postData = '<build personal="' + (parameters.personal ? 'true' : 'false') + '"';
    if (parameters.branch && !parameters.branch.default) {
        postData += ' branchName="' + parameters.branch.name + '" ';
    }
    postData += '>' +
        '<buildType id="' + id + '"/>';
    if (parameters.agentId) {
        postData += '<agent id="' + parameters.agentId + '"/>'
    }
    postData += '</build>';
    return postData;
}
