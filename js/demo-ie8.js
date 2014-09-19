function showModal() {
  $('#websocket-support-modal').modal('show');
}

$(document).ready(function makeModal () {
  $('#ivy-container').hide();
  $('#evita-container').hide();
  $('#connectionStateAlert').hide();
  $('#websocket-support-modal').modal('show');
  var child = document.createElement('iframe');
  child.src = 'https://player.vimeo.com/video/99546813?autoplay=1&loop=1';
  child.id = "player";
  child.height = 300;
  child.frameborder = 0;
  document.getElementById('vimeo').appendChild(child);
  
  var inpage = document.createElement("div");
  inpage.innerHTML = "Your browser is unsupported.  <a href=\"javascript:showModal()\">Click here</a> for more information.";
  document.getElementById('header-demo').appendChild(inpage);
});
