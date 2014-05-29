$(document).ready( function fixedNav() {
    var nav = $('#main-navbar');
    var height = nav.height();
    var distance = nav.offset().top;
    $window = $(window);
    height = height + 20; //.height() doesn't account for padding or margin

    $window.scroll( function() {
        if ( $window.scrollTop() >= distance ) {
            nav.addClass('navbar-fixed-top');
            $('body').css('margin-top',height);
        } else {
            nav.removeClass('navbar-fixed-top');
            $('body').css('margin-top',0);
        }
    });
});

function resizeBigNumber (argument) {
    // body...
    //$( "bigNumber" ).width();

};