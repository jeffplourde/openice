"use strict";

var patientData = {};
var observationData = {};

window.onload = function() {
  patientData = PopulatePatientData();

};

function PopulatePatientData () {
  $.get("https://fhir.openice.info/fhir/Patient?_count=100", function( data ) {
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

      var givenNameNode = document.createElement('span');
      givenNameNode.appendChild(document.createTextNode(pt.name[0].given[0]));
      givenNameNode.className += ' mrs-pt-givenNameNode';
      ptContainer.appendChild(givenNameNode);

      var familyNameNode = document.createElement('span');
      familyNameNode.appendChild(document.createTextNode(pt.name[0].family[0]));
      familyNameNode.className += ' mrs-pt-familyNameNode';
      ptContainer.appendChild(familyNameNode);

      if (pt.identifier && pt.identifier.length > 0 && pt.identifier[0] && pt.identifier[0].value) {
        var mrnNode = document.createElement('span');
        mrnNode.appendChild(document.createTextNode(pt.identifier[0].value));
        mrnNode.className += ' mrs-pt-identifier';
        ptContainer.appendChild(mrnNode);
      } else {
        console.log('No mrn on patient ID ', pt.id ? pt.id : '')
      };

      if (pt.gender) {
        var genderNode = document.createElement('span');
        genderNode.appendChild(document.createTextNode(pt.gender));
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

      // var ptAgeNode = document.createTextNode();

      ptContainer.addEventListener('click', function() { ChangeActivePatient(pt.id) }, false);
      document.getElementById("mrs-patient-list").appendChild(ptContainer);
    })()
  };
};

function GetPatientObservations () {
  console.log('Getting observations for all patients');
  // need to find proper REST query...

  // match observations to patients somehow

  ConstructPatientDashboards();
  
  return observationData;
};

function ConstructPatientDashboards () {

  for (var i = 0; i < Object.keys(patientData).length; i++) {
    var pt = patientData[Object.keys(patientData)[i]];

    var ptContainer = document.createElement('div');
    ptContainer.id = 'dashboard-' + pt.id;
    ptContainer.style.display = 'none';
    // $(ptContainer).css({display:"none"});
    document.getElementById("mrs-demo-dashboard").appendChild(ptContainer);
  };

};

function ChangeActivePatient (patientID) {
  var selectedPtContainer = document.getElementById(patientID);
  
  if ( $(selectedPtContainer).hasClass('active') ) {
    console.log('Patient selected is already active. PID', patientID);
  } else {
    $(document.getElementById("mrs-patient-list").getElementsByClassName('active')).removeClass('active');
    $(selectedPtContainer).addClass('active');
    SwitchPatientView(patientID);
  };
};

function SwitchPatientView (patientID) {
  console.log('Switching dashboard view to patient', patientID);
  // hide splash screen
  if (document.getElementById('himss-dashboard-splash')) {
    var splash = document.getElementById('himss-dashboard-splash');
    splash.parentNode.removeChild(splash);
  };

  var pt = patientData[patientID];
  var patientHeader = document.getElementById('mrs-demo-patientHeader')

  // switch dashboard patient header
  patientHeader.innerHTML = null;

  var givenNameNode = document.createElement('span');
  givenNameNode.appendChild(document.createTextNode(pt.name[0].given[0]));
  givenNameNode.className += ' mrs-demo-givenNameNode';
  patientHeader.appendChild(givenNameNode);

  var familyNameNode = document.createElement('span');
  familyNameNode.appendChild(document.createTextNode(pt.name[0].family[0]));
  familyNameNode.className += ' mrs-demo-familyNameNode';
  patientHeader.appendChild(familyNameNode);

  if (pt.identifier && pt.identifier.length > 0 && pt.identifier[0] && pt.identifier[0].value) {
    var mrnNode = document.createElement('span');
    mrnNode.appendChild(document.createTextNode(pt.identifier[0].value));
    mrnNode.className += ' mrs-demo-identifier';
    patientHeader.appendChild(mrnNode);
  };

  if (pt.gender) {
    var genderNode = document.createElement('span');
    genderNode.appendChild(document.createTextNode(pt.gender));
    genderNode.className += ' mrs-demo-gender';
    patientHeader.appendChild(genderNode);
  };

  if (pt.birthDate) {
    var dobNode = document.createElement('span');
    dobNode.appendChild(document.createTextNode(pt.birthDate));
    dobNode.className += ' mrs-demo-birthDate';
    patientHeader.appendChild(dobNode);
  };

  // var ptAgeNode = document.createTextNode();

  var dashboard = document.getElementById('mrs-demo-dashboard');
  // dashboard.innerHTML = null;

  // change visibility to visible for div id='dashboard-'+pt.id
  // ptContainer.style.display = 'visible';

};
