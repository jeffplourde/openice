"use strict";

window.onload = function() {
  PopulatePatientList();
};

function PopulatePatientList () {
  $.get("https://fhir.openice.info/fhir/Patient?_count=100", function( data ) {
    console.log(data);
    var patientData = data.entry;
    if (data.entry) {
      WriteDataToDom(patientData);
    } else {
      alert('No patients to display');
      console.log('FHIR query to fhir.openice.info/Patient returned no data.entry')
    };
  });

  function WriteDataToDom (patientData) {
    document.getElementById('mrs-patient-list').innerHTML = null;
    // console.log(patientData);

    for (var i = 0; i < patientData.length; i++) {
      var pt = patientData[i].resource;
      console.log(pt);

      // Require given and family name
      if (pt.name && pt.name.length > 0 && pt.name[0].given && pt.name[0].given.length > 0
            && pt.name[0].family && pt.name[0].family.length > 0) {
        
        var ptContainer = document.createElement('div');
        ptContainer.className += ' mrs-pt-container';

        var ptGivenNameNode = document.createElement('span');
        ptGivenNameNode.appendChild(document.createTextNode(pt.name[0].given[0]));
        ptGivenNameNode.className += ' mrs-pt-givenName';
        ptContainer.appendChild(ptGivenNameNode);

        var ptFamilyNameNode = document.createElement('span');
        ptFamilyNameNode.appendChild(document.createTextNode(pt.name[0].family[0]));
        ptFamilyNameNode.className += ' mrs-pt-familyName';
        ptContainer.appendChild(ptFamilyNameNode);

        if (pt.identifier && pt.identifier.length > 0 && pt.identifier[0] && pt.identifier[0].value) {
          var ptMrnNode = document.createElement('span');
          ptMrnNode.appendChild(document.createTextNode(pt.identifier[0].value));
          ptMrnNode.className += ' mrs-pt-mrn';
          ptContainer.appendChild(ptMrnNode);
        };

        if (pt.gender) {
          var ptGenderNode = document.createElement('span');
          ptGenderNode.appendChild(document.createTextNode(pt.gender));
          ptGenderNode.className += ' mrs-pt-gender';
          ptContainer.appendChild(ptGenderNode);
        };
        // var ptAgeNode = document.createTextNode();
        // var ptDobNode = document.createTextNode();

        ptContainer.addEventListener('click', function() { ChangeActivePatient(pt.id) }, false);
        document.getElementById("mrs-patient-list").appendChild(ptContainer);
      } else {
        console.log('Patient omitted from list due to missing or bad given or family name.')
      }
    }
  }
};
function ChangeActivePatient (patientID) {
  alert('Patient ID ' + patientID + ' was clicked');
}