/**
 * Created by Martin Varga on 21/10/2015.
 */
var app = angular.module('tacos', ['ngMaterial', 'ngMdIcons']);

app.factory('socket', function ($rootScope) {
    var socket = io();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

app.config(function ($mdThemingProvider, $mdIconProvider) {
//red, pink, purple, deep-purple, indigo, blue, light-blue, cyan, teal, green, light-green, lime, yellow, amber, orange, deep-orange, brown, grey, blue-grey
    $mdThemingProvider.theme('default')
        //.dark()
        .primaryPalette('yellow')
        .accentPalette('green')
        .warnPalette('red');
    $mdIconProvider
        .iconSet('social', 'webjarimg/icons/sets/social-icons.svg', 24)
        .iconSet('device', 'img/icons/sets/device-icons.svg', 24)
        .iconSet('communication', 'img/icons/sets/communication-icons.svg', 24)
        .defaultIconSet('img/icons/sets/core-icons.svg', 24);
});

app.controller('IndexCtrl', function ($scope, $mdToast, socket) {

    $scope.selectAll = function () {
        $scope.builds.forEach(function (c) {
            c.selected = true;
        });
    };

    $scope.unselectAll = function () {
        $scope.builds.forEach(function (c) {
            c.selected = false;
        });
    };

    $scope.queue = function () {
        var parameters = {
            project: $scope.selectedProject,
            branch: JSON.parse($scope.selectedBranch), // it's saved as text on the page
            personal: $scope.personal
        };
        if ($scope.selectedAgent) {
            parameters.agentId = $scope.selectedAgent
        }
        socket.emit('gui:queue', {"builds": $scope.builds, "parameters": parameters});
    };

    $scope.getBuilds = function () {
        socket.emit('gui:builds', {projectId: $scope.selectedProject});
    };

    $scope.personal = false;
    $scope.projects = [];
    $scope.agents = [];
    $scope.branches = [];
    $scope.selectedProject = null;
    $scope.selectedBranch = null;
    $scope.builds = [];
    var defaultAgent = {
        'id': '',
        'name': 'Any agent'
    };
    $scope.selectedAgent = null;

    socket.on('server:done', function () {
        $mdToast.show(
            $mdToast.simple()
                .content('Done!')
                .hideDelay(3000)
        );
    });

    socket.on('server:projects', function (projects) {
        $scope.projects = projects;
    });

    socket.on('server:agents', function (agents) {
        $scope.agents = agents;
        $scope.agents.unshift(defaultAgent);
        $scope.selectedAgent = defaultAgent.id;
    });

    socket.on('server:branches', function (branches) {
        $scope.branches = branches;
    });

    socket.on('server:builds', function (builds) {
        $scope.builds = builds;
    });
});