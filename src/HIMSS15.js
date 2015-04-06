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
      // console.log(pt);

      var ptContainer = document.createElement('div');
      ptContainer.className += ' mrs-ptContainer';

      ptContainer.id = pt.id;

      var familyNameNode = document.createElement('span');
      familyNameNode.appendChild(document.createTextNode(pt.name[0].family[0]));
      familyNameNode.className += ' mrs-pt-familyNameNode';
      ptContainer.appendChild(familyNameNode);

      var givenNameNode = document.createElement('span');
      givenNameNode.appendChild(document.createTextNode(pt.name[0].given[0]));
      givenNameNode.className += ' mrs-pt-givenNameNode';
      ptContainer.appendChild(givenNameNode);

      if (pt.gender) {
        var genderNode = document.createElement('span');
        var g = (pt.gender === 'male') ? 'M' : 'F';
        genderNode.appendChild(document.createTextNode(g));
        genderNode.className += ' mrs-pt-gender';
        ptContainer.appendChild(genderNode);
      } else {
        console.log('No gender on patient ID', pt.id ? pt.id : '')
      };

      if (pt.birthDate) {
        var dobNode = document.createElement('span');
        dobNode.appendChild(document.createTextNode(pt.birthDate));
        dobNode.className += ' mrs-pt-birthDate';
        ptContainer.appendChild(dobNode);
      } else {
        console.log('No date of birth on patient ID', pt.id ? pt.id : '')
      };

      if (pt.identifier && pt.identifier.length > 0 && pt.identifier[0] && pt.identifier[0].value) {
        var mrnNode = document.createElement('span');
        mrnNode.appendChild(document.createTextNode(pt.identifier[0].value));
        mrnNode.className += ' mrs-pt-identifier';
        ptContainer.appendChild(mrnNode);
      } else {
        console.log('No mrn on patient ID ', pt.id ? pt.id : '')
      };

      // var ptAgeNode = document.createTextNode();

      ptContainer.addEventListener('click', function() { ChangeActivePatient(pt.id) }, false);
      document.getElementById("mrs-patient-list").appendChild(ptContainer);
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

    var metrics = Object.keys(data);

    for (var i = 0; i < metrics.length; i++) {

      var chartContainer = jQuery('<div/>', {
        id: 'chartContainer-' + pt + '-' + metrics[i],
        'class': 'chartContainer'
      }).appendTo(dashboard);

      var yAxis = jQuery('<div/>', {
        id: 'yAxis-' + pt + '-' + metrics[i],
        'class': 'yAxis'
      }).appendTo(chartContainer);

      var chart = jQuery('<div/>', {
        id: 'chart-' + pt + '-' + metrics[i],
        'class': 'chart'
      }).appendTo(chartContainer);

      var graph = new Rickshaw.Graph({
        element: chart[0],
        // width: 500,
        width: $('#mrs-demo-dashboardHolder').innerWidth() - 110,
        height: 300,
        renderer: 'line',
        max: 200,
        series: [
          {
            color: "#c05020",
            data: data[metrics[i]],
            name: metrics[i]
          }
        ]
      });

      var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );

      var y_axis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        orientation: 'left',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: yAxis[0],
      });

      new Rickshaw.Graph.HoverDetail({ graph: graph });

      graph.render();
    };
  }
};
// function ConstructPatientDashboard (pt) {
//   var data = observationData[pt];

//   if (data) {
//     console.log('creating dashboard for pt', pt);

//     var dashboard = jQuery('<li/>', {
//         id: 'dashboard-' + pt,
//         'class': 'mrs-dashboard'
//       }).hide().appendTo('#mrs-demo-dashboardHolder');

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