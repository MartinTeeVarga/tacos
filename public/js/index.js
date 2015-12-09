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
        .dark()
        .primaryPalette('orange')
        .accentPalette('yellow')
        .warnPalette('deep-orange');
    $mdIconProvider
        .iconSet('social', 'webjarimg/icons/sets/social-icons.svg', 24)
        .iconSet('device', 'img/icons/sets/device-icons.svg', 24)
        .iconSet('communication', 'img/icons/sets/communication-icons.svg', 24)
        .defaultIconSet('img/icons/sets/core-icons.svg', 24);
});

app.controller('IndexCtrl', function ($scope, $mdToast, socket) {
    $scope.queueMaster = function () {
        socket.emit('gui:queue', {branch: "master", personal: $scope.personal});
    };

    $scope.queueDev = function () {
        socket.emit('gui:queue', {branch: "dev", personal: $scope.personal});
    };

    $scope.personal = false;

    socket.on('done', function() {
        $mdToast.show(
            $mdToast.simple()
                .content('Done!')
                .hideDelay(3000)
        );
    });
});