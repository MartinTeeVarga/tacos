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

app.controller('IndexCtrl', function ($scope, $mdToast, $filter, socket) {

    $scope.isLoading = true;

    $scope.isSomethingSelected = function () {
        function isSelected(b) {
            return b.selected;
        }

        return $scope.builds.some(isSelected);
    };

    $scope.selectAll = function () {
        var filtered = $filter('filter')($scope.builds, $scope.filterText);
        filtered.forEach(function (c) {
            c.selected = true;
        });
    };

    $scope.unselectAll = function () {
        var filtered = $filter('filter')($scope.builds, $scope.filterText);
        filtered.forEach(function (c) {
            c.selected = false;
        });
    };

    $scope.queue = function () {
        function isSelected(b) {
            return b.selected;
        }

        var filtered = $scope.builds.filter(isSelected);
        $scope.isLoading = true;

        var parameters = {
            project: $scope.selectedProject,
            branch: $scope.selectedBranch,
            personal: $scope.personal
        };
        if ($scope.selectedAgent) {
            parameters.agentId = $scope.selectedAgent
        }
        socket.emit('gui:queue', {"builds": filtered, "parameters": parameters});
    };

    $scope.getBuilds = function () {
        $scope.isLoading = true;
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
        $scope.isLoading = false;
    });

    socket.on('server:error', function (name) {
        $mdToast.show(
            $mdToast.simple()
                .content("Error queueing" + name)
                .hideDelay(5000)
        );
        $scope.isLoading = false;
    });

    socket.on('server:projects', function (projects) {
        $scope.projects = projects;
        $scope.isLoading = false;
    });

    socket.on('server:agents', function (agents) {
        $scope.agents = agents;
        $scope.agents.unshift(defaultAgent);
        $scope.selectedAgent = defaultAgent.id;
        $scope.isLoading = false;
    });

    socket.on('server:builds', function (data) {
        $scope.builds = data.builds;
        $scope.branches = data.branches;
        $scope.selectedBranch = $scope.branches.find(function (b) {
            return b.default;
        });
        $scope.selectAll();
        $scope.isLoading = false;
    });
});