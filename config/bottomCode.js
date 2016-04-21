/**
 * Created by paulcook on 21/04/16.
 */
function cssLoaded(number,link) {
    /*            console.log('css loaded', number,link, new Date().getTime() - window.results[0].getTime(),
     document.getElementsByTagName('head')[0].getElementsByTagName('*').length ,
     document.getElementsByTagName('link').length );*/
    if ( number === window.stylesheets ) {
        checkPerformanceAPI('My RenderStart')();
    }

}
forEach( document.getElementsByTagName('link' ) , function (link) {
    if ( link.rel === 'stylesheet' && !link.onload ) {
        var sheetNumber = ++window.stylesheets;
        link.onload= function () {
            cssLoaded( sheetNumber , link);
        };
    }
} );
