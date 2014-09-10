'use strict'
var OpenICE = require('../../src/openice.js');

(function() {
  var app = angular.module('usc', []);

  app.directive("navbar", function() {
    return {
      restrict: 'E',
      templateUrl: "templates/navbar.html"
    };
  });

  app.controller("DeviceIdentityController", function() {
    var devices = this;

    devices.openICE = new OpenICE("http://dev.openice.info:80");

    devices.table = devices.openICE.createTable({domain:15,topic:'DeviceIdentity',partition:[]});

    devices.deviceList = ['foo','bar','yoooo', new Date()];
    // devices.table.on('sample', function(e) {
    //   console.log(e.sample.data);
    //   devices.deviceList.push(e.sample.data);
      // diTable = JSON.stringify(e.sample.data);
    // });
  });
})();