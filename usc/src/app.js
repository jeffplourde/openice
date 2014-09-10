'use strict'
var OpenICE = require('../../src/openice.js');

(function() {
  var app = angular.module('usc', []);

  app.factory('openice', function ($rootScope) {
    var openICE = new OpenICE("http://dev.openice.info:80");
    console.log(openICE);
    return {
      on: function (eventName, callback) {
        openICE.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(openICE, args);
          });
        });
      },
      createTableAndRegister: function (a, eventName, callback) {

        var table = openICE.createTable(a);
        for(var i = 0; i < eventName.length; i++) {
          table.on(eventName[i], function() {
            var args = arguments;
            $rootScope.$apply(function () {
              if (callback) {
                callback.apply(openICE, args);
              }
            });
          });
        }
        return table;
      }
    };
  });


  app.directive("navbar", function() {
    return {
      restrict: 'E',
      templateUrl: "templates/navbar.html"
    };
  });

  app.controller("DeviceIdentityController", ['$scope', 'openice', function($scope, openice) {
    var devices = this;
    devices.deviceNames = {};
    var partition = ["ICU"];


    devices.deviceTable = openice.createTableAndRegister({domain:15,'partition':partition,topic:'DeviceIdentity'}, ['sample','afterremove'], function(foo) {
    });
    // Maintain a hash of device make/model by UDI
    devices.deviceTable.on('sample', function(e) {
      devices.deviceNames[e.row.keyValues.unique_device_identifier] = e.sample.data.manufacturer + " " + e.sample.data.model;
    });

    devices.numericTable = openice.createTableAndRegister({domain:15,'partition':partition,topic:'Numeric'}, ['sample','afterremove'], function(foo) {
    });
  }]);
})();