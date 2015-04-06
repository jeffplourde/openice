"use strict";

var patientData = {};
var observationData = {};

window.onload = function() {
  patientData = PopulatePatientData();

};

function PopulatePatientData () {
  $.get("https://fhir.openice.info/fhir/Patient?_count=100", function( data ) {
  // $.get("http://fhirtest.uhn.ca/baseDstu2/Patient?active=true&_count=500", function( data ) {
    console.log(data);

    if (data.entry && data.entry.length > 0) {
      patientData = {};
      for(var i = 0; i < data.entry.length; i++) {
        var pt = data.entry[i].resource;
        // Require given and family name
        if (pt.name && pt.name.length > 0 && pt.name[0].given && pt.name[0].given.length > 0
              && pt.name[0].family && pt.name[0].family.length > 0) {
          patientData[data.entry[i].resource.id] = data.entry[i].resource;
        } else {
          console.log('Patient data omitted from list due to missing name value. ID: ', pt.id ? pt.id : '')
        };
      };
      ConstructPatientList(patientData);
      GetPatientObservations();
    } else {
      alert('No patients to display');
      console.log('FHIR query to fhir.openice.info/Patient returned no data.entry');
    };
  });
  return patientData;
};

function ConstructPatientList (patientData) {
  document.getElementById('mrs-patient-list').innerHTML = null;

  for (var i = 0; i < Object.keys(patientData).length; i++) {
    (function () {
      var pt = patientData[Object.keys(patientData)[i]];

      var ptContainer = jQuery('<table/>', {
        id: pt.id,
        'class': 'mrs-ptContainer'
      });

      var topRow = jQuery('<tr/>').appendTo(ptContainer);
      var bottomRow = jQuery('<tr/>').appendTo(ptContainer);

      jQuery('<td/>', { 'class': 'mrs-pt-familyName' }).html(pt.name[0].family[0]).appendTo(bottomRow);
      jQuery('<td/>', { 'class': 'mrs-pt-givenName' }).html(pt.name[0].given[0]).appendTo(topRow);

      var age = null;
      if (pt.birthDate) {
        age = moment().diff(pt.birthDate, 'years');
      };
      jQuery('<td/>', { 'class': 'mrs-pt-birthDate' }).html(age).appendTo(topRow);

      jQuery('<td/>', { 'class': 'mrs-pt-gender' }).html((pt.gender === 'male') ? 'M' : 'F')
          .appendTo(topRow);

      jQuery('<td/>', { 'class': 'mrs-pt-identifier' }).html(pt.identifier[0].value)
          .attr('colspan', '2').appendTo(bottomRow);

      ptContainer.click(function() { ChangeActivePatient(pt.id) }).appendTo('#mrs-patient-list')

    })()
  };
};

function GetPatientObservations () {
  console.log('Getting observations for all patients');

  for (var i = 0; i < Object.keys(patientData).length; i++) {
    (function () {
      var pt = Object.keys(patientData)[i];

      $.get('https://fhir.openice.info/fhir/Observation?subject=Patient/'+pt+'&_count=10000', function( data ) {
        // console.log('Data for pt:', pt, data);

        if (data.total) {
          for (var j = 0; j < data.entry.length; j++) {
            var metric = data.entry[j].resource.valueQuantity.code;
            var t = +UTCtoEpoch(data.entry[j].resource.appliesDateTime);
            var y = data.entry[j].resource.valueQuantity.value;

            // this looks ugly but I'm not sure what would make it better
            if (metric && t && y) {
              if (!observationData[pt]) { observationData[pt] = {} };
              if (!observationData[pt][metric]) { observationData[pt][metric] = [] };
              observationData[pt][metric].push({'x':t, 'y':y});
            };
          }

          // Sort metric observations by time
          for (var k = 0; k < Object.keys(observationData[pt]).length; k++) {
            observationData[pt][Object.keys(observationData[pt])[k]].sort(function (a, b) {
              return a.x - b.x
            });
          };

          ConstructPatientDashboard(pt);
          patientData[pt].hasData = true;
          $( '#'+pt ).removeClass('noData');
        } else {
          console.log('No observations found for patient ID', pt);
          patientData[pt].hasData = false;
          $( '#'+pt ).addClass('noData');
        }
      })
    })()
  }
};

// THIS DOESN'T WORK YET
// $( window ).resize(function () {
//   var pt = Object.keys(patientData);
//   for (var i = 0; i < pt.length; i++) {
//     if (pt[i].hasData === true) {
//       ConstructPatientDashboard(pt[i]);
//       console.log(pt[i]);
//     }
//   }
// });

function ConstructPatientDashboard (pt) {
  var data = observationData[pt];

  if (data) {
    console.log('creating dashboard for pt', pt);

    var dashboard = jQuery('<li/>', {
      id: 'dashboard-' + pt,
      'class': 'mrs-dashboard'
    }).hide().appendTo('#mrs-demo-dashboardHolder');

    var chartContainer = jQuery('<div/>', {
      id: 'chartContainer-' + pt,
      'class': 'chartContainer'
    }).appendTo(dashboard);

    var yAxis = jQuery('<div/>', {
      id: 'yAxis-' + pt,
      'class': 'yAxis'
    }).appendTo(chartContainer);

    var chart = jQuery('<div/>', {
      id: 'chart-' + pt,
      'class': 'chart'
    }).appendTo(chartContainer);
    
    var legend = jQuery('<div/>', {
      id: 'legend-' + pt,
      'class': 'chartLegend'
    }).appendTo(chartContainer);

    var palette = new Rickshaw.Color.Palette( { scheme: 'munin' } );

    var graphData = [];
    var metrics = Object.keys(data);
    for (var i = 0; i < metrics.length; i++) {
      graphData.push({
        name: metrics[i],
        data: data[metrics[i]],
        color: palette.color()
      });
    };

    var graph = new Rickshaw.Graph({
      element: chart[0],
      width: $('#mrs-demo-dashboardHolder').innerWidth() - 110,
      height: 400,
      renderer: 'line',
      max: 200,
      series: graphData
    });

    var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );

    var y_axis = new Rickshaw.Graph.Axis.Y( {
      graph: graph,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: yAxis[0],
    });

    new Rickshaw.Graph.HoverDetail({ graph: graph });

    var legend = new Rickshaw.Graph.Legend({
        graph: graph,
        element: legend[0]
    });
    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
        graph: graph,
        legend: legend
    });
    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
        graph: graph,
        legend: legend
    });

    graph.render();
    
  }
};
// function ConstructPatientDashboard (pt) {
//   var data = observationData[pt];

//   if (data) {
//     console.log('creating dashboard for pt', pt);

//     var dashboard = jQuery('<li/>', {
//       id: 'dashboard-' + pt,
//       'class': 'mrs-dashboard'
//     }).hide().appendTo('#mrs-demo-dashboardHolder');

//     var metrics = Object.keys(data);

//     for (var i = 0; i < metrics.length; i++) {

//       var chartContainer = jQuery('<div/>', {
//         id: 'chartContainer-' + pt + '-' + metrics[i],
//         'class': 'chartContainer'
//       }).appendTo(dashboard);

//       var yAxis = jQuery('<div/>', {
//         id: 'yAxis-' + pt + '-' + metrics[i],
//         'class': 'yAxis'
//       }).appendTo(chartContainer);

//       var chart = jQuery('<div/>', {
//         id: 'chart-' + pt + '-' + metrics[i],
//         'class': 'chart'
//       }).appendTo(chartContainer);

//       var graph = new Rickshaw.Graph({
//         element: chart[0],
//         // width: 500,
//         width: $('#mrs-demo-dashboardHolder').innerWidth() - 110,
//         height: 300,
//         renderer: 'line',
//         max: 200,
//         series: [
//           {
//             color: "#c05020",
//             data: data[metrics[i]],
//             name: metrics[i]
//           }
//         ]
//       });

//       var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );

//       var y_axis = new Rickshaw.Graph.Axis.Y( {
//         graph: graph,
//         orientation: 'left',
//         tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
//         element: yAxis[0],
//       });

//       new Rickshaw.Graph.HoverDetail({ graph: graph });

//       graph.render();
//     };
//   }
// };

function ChangeActivePatient (patientID) {
  var selectedPtContainer = document.getElementById(patientID);

  if ( $(selectedPtContainer).hasClass('activePt') ) {
    console.log('Patient selected is already active. PID', patientID);
  } else {
    console.log('Switching dashboard view to patient', patientID);

    // change active class in patient menu
    $(document.getElementById("mrs-patient-list").getElementsByClassName('activePt')).removeClass('activePt');
    $(selectedPtContainer).addClass('activePt');

    // remove splash screen
    $('#himss-dashboard-splash').hide();

    // switch dashboard patient header
    document.getElementById('mrs-demo-patientHeader').innerHTML = null;
    $('#' + patientID).clone().attr('id', 'mrs-header-' + patientID).removeClass().addClass('mrs-header')
        .appendTo('#mrs-demo-patientHeader');

    // switch dashboard visibility
    $('#mrs-demo-dashboardHolder').children().hide();
    $('#dashboard-' + patientID).show();
  };
};


function UTCtoEpoch (t) {
  return moment(t, moment.ISO_8601).format('X');
}