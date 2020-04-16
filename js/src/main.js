const GOOGLE_MAPS_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAbUAtoV_wlrVVYiC8Yn0yqryf0lTTIi5M&callback=loadMapAPIsCallback";

var url = new URL(window.location.href);
var centerLat = parseFloat(url.searchParams.get("centerLat"));
var centerLng = parseFloat(url.searchParams.get("centerLng"));
var zoom = parseInt(url.searchParams.get("zoom"));
if(isNaN(zoom))
    zoom = 9;

var INITIAL_CENTER = { "lat" : 39.3 || centerLat, "lng" : 9 || centerLng };

if(!isNaN(centerLat) && !isNaN(centerLng))
{
    INITIAL_CENTER.lat = centerLat;
    INITIAL_CENTER.lng = centerLng;
}

var lower_range_bound = parseFloat(url.searchParams.get("rangeLower"));
var upper_range_bound = parseFloat(url.searchParams.get("rangeUpper"));
if(isNaN(lower_range_bound))
    lower_range_bound = 0;
if(isNaN(upper_range_bound))
    upper_range_bound = 1;


var maps = [];
var map;
var UIs = [];

/*require([
    "js/lib/jquery-3.1.1.js",
    "js/src/utils.js",
    "js/src/DataContainer.js",
    "js/src/MarkerFactory.js",
    "js/src/CategoryHandler.js",
    "js/src/UI.js",
    "js/src/EventListener.js"
], function()
{
    require(["js/lib/jquery.easing.1.3.js", "js/lib/jquery.popcircle.1.0.js"]);
    window.dataContainer = new DataContainer();
    window.categoryHandler = new CategoryHandler();

    window.loadMapAPIsCallback = function()
    {
        map = new google.maps.Map(document.getElementById("staticMap"),
            {
                zoom: 9,
                center: new google.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
                mapTypeId: 'roadmap'
            });

        map.setOptions({ draggable : false, zoomControl : false, scrollwheel: false, disableDoubleClickZoom: true });

        EventListener.listenToMouseClick();

        var staticMapNode = $("#staticMap");
        var staticMapSize = { width : staticMapNode.width(), height : staticMapNode.height() };
        var containerSize = Math.min(staticMapSize.width, staticMapSize.height);
        const PERCENTAGE = 50;

        containerSize = containerSize /  100 * PERCENTAGE;
        UI.size = containerSize;
    };
    window.initMap = function()
    {

        var mapId = "map-" + maps.length;
        var mapDiv = $(document.createElement("div")).attr("id", mapId).addClass("map").css({ "width" : UI.size, "height" : UI.size})[0];
        $("#staticMapContainer").append(mapDiv);

        maps.push(new google.maps.Map(mapDiv,
            {
                zoom: 9,
                center: new google.maps.LatLng(map.lat, map.lng),
                mapTypeId: 'roadmap'
            }));
        return maps[maps.length - 1];
    };

});*/

$(function()
{
    window.dataContainer = new DataContainer();
    window.categoryHandler = new CategoryHandler();

    window.loadMapAPIsCallback = function()
    {
        map = new google.maps.Map(document.getElementById("staticMap"),
            {
                zoom: zoom,
                center: new google.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
                disableDefaultUI: true,
                mapTypeId: 'roadmap'
            });

        map.setOptions({ draggable : false, zoomControl : false, scrollwheel: false, disableDoubleClickZoom: true });

        EventListener.listenToMouseClick();

        var staticMapNode = $("#staticMap");
        var staticMapSize = { width : staticMapNode.width(), height : staticMapNode.height() };
        var containerSize = Math.min(staticMapSize.width / 2, staticMapSize.height);
        const PERCENTAGE = 70;

        containerSize = containerSize /  100 * PERCENTAGE;
        UI.size = containerSize;
    };
    window.initMap = function()
    {

        var mapId = "map-" + UI.counter;
        var mapDiv = $(document.createElement("div")).attr("id", mapId).addClass("map").css({ "width" : UI.size, "height" : UI.size})[0];
        $("#staticMapContainer").append(mapDiv);

        var map_ = new google.maps.Map(mapDiv,
            {
                zoom: map.getZoom(),
                center: new google.maps.LatLng(map.lat, map.lng),
                mapTypeId: 'roadmap',
                gestureHandling: "greedy"
            });


        /*map_.addListener("dragstart", function(ev)
         {
         console.log(ev)}
         );
         map_.addListener("drag", function(ev)
         {
         console.log(ev)}
         );
         map_.addListener("dragend", function(ev)
         {
         console.log(ev)}
         );*/
        maps.push(map_);
        return maps[maps.length - 1];
    };

    $(function()
    {
        $.getScript("https://www.youtube.com/iframe_api");
        $.getScript(GOOGLE_MAPS_SCRIPT_URL);
        $.getScript("http://followme.crs4.it:8080/pois?callback=dataContainer.setPois");
        $.getScript("http://followme.crs4.it:8080/categories?callback=dataContainer.setCategories");
        $.getScript("http://followme.crs4.it:8080/images?callback=dataContainer.setImages");
    });

    window.onYouTubeIframeAPIReady = function()
    {
        console.log("YouTube APIs loaded.");
    };

    document.addEventListener("touchstart", function(ev)
    {
        ev.preventDefault();
        //parent.$('body').trigger('touchstart');
    }, { passive : false });
});
// TODO: add FTScroller to UI text!
// TODO: fix the TouchEmulator extension, it makes requireJS crash