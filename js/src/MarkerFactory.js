var MarkerFactory = function(map, parent)
{
    this.markers = {};
    //var circles = {};

    this.createMarker = function(poi)
    {
        /*var circle = new google.maps.Circle(
            {
                strokeColor : "#000000",
                strokeOpacity: 0.8,
                strokeWeight : 2,
                fillColor : "#00000A",
                fillOpacity : 0.35,
                map : map,
                center : { lat: poi.lat, lng: poi.lng },
                radius : 10000
            }
        );

        circles[poi.id] = circle;*/

        var marker = new google.maps.Marker
        ({
            position: new google.maps.LatLng(poi.lat, poi.lng),
            map: map,
            icon : dataContainer.getCategoryIcon(poi.category)
        });

        marker.addListener("click", function()
        {
            parent.currentPoi = poi;
            parent.printPoiText();
            //parent.preLoadEmbeddedYouTubeVideo();
            parent.preloadVideoFromServer();
            parent.preload3dModel();
            parent.preloadPanoramicImage();
            parent.showOverlay();
        });
        this.markers[poi.id] = marker;
    };

    this.removeMarker = function(poi)
    {
        this.markers[poi.id].setMap(null);
        this.markers[poi.id].removeListener("click");
        delete this.markers[poi.id];
    };

    this.clearAllMarkers = function()
    {
        for(var i in this.markers)
        {
            this.markers[i].setMap(null);
            delete this.markers[i];
        }
    };
};

