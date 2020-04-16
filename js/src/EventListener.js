var EventListener = {};

EventListener.listenToMouseClick = function()
{
    google.maps.event.addListener(map, "mousedown", function(googleEv)
    {
        console.log(event);
        map.lat = googleEv.latLng.lat();
        map.lng = googleEv.latLng.lng();

        console.log(map.lat, map.lng, googleEv.pixel);
        if(map.pendingMap)
        {
            map.pendingMap.setCenter(new google.maps.LatLng(map.lat, map.lng));
        }

        EventListener.manageTouchOrClick(googleEv.pixel.x, googleEv.pixel.y);
    });
};

EventListener.stopListeningToMouseClick = function()
{
    $("#staticMapContainer").off("click");
};

EventListener.bindCategoryButton = function(parentUI, button, category)
{
    button.on("mousedown", function()
    {
        parentUI.markerFactory.clearAllMarkers();
        categoryHandler.showCategory(category, parentUI);
    })
};

EventListener.bind2ndLevelButton = function(parentUI, button, type)
{
    var handlerFunction;

    switch (type)
    {
        case "close":
            handlerFunction = function()
            {
                if(parentUI.overlayVisibility === true)
                    parentUI.hideOverlay();
                else
                    parentUI.hideCircleInterface();
            };
            break;
        case "text":
            handlerFunction = function() { parentUI.printPoiText(); };
            break;
        case "video":
            handlerFunction = function() { parentUI.showEmbeddedYouTubeVideo(true); };
            break;
        case "3D":
            handlerFunction = function() { parentUI.show3dModel(); };
            break;
        case "photo":
            handlerFunction = function() { parentUI.showPoiImages(); };
            break;
        case "next":
            handlerFunction = function() { parentUI.nextImage(); };
            break;
        case "prev":
            handlerFunction = function() { parentUI.prevImage(); };
            break;
        case "globe":
            handlerFunction = function() { parentUI.showPanorama(); };
            break;
        case "move":
            handlerFunction = function(event) {};
            break;
        default :
            handlerFunction = function() { console.log(type);};
            break;
    }

    //button.on("click", handlerFunction)
    button.on("mousedown", function(ev)
    {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        handlerFunction();
    });
};

EventListener.manageTouchOrClick = function(x, y)
{
    function getNextAvailableUISlot()
    {
        //return null; // TODO: note it's a feature just for the airport
        var res = null;

        for(var i = 0; i < UIs.length; i++)
            if(UIs[i].circleVisibility === false)
            {
                res = UIs[i];
                break;
            }

        return res;
    }

    const TOLERANCE_MARGIN = 100;
    for(var i = 0; i < UIs.length; i++)
    {
        var center = UIs[i].circleCenter;
        var radius = UIs[i].radius + TOLERANCE_MARGIN;

        if(UIs[i].circleVisibility === true
            && x >= center.x - radius
            && x < center.x + radius
            && y >= center.y - radius
            && y < center.y + radius)
        {
            return;
        }
    }

    var freeUISlot = getNextAvailableUISlot();
    if(!freeUISlot)
    {
        if(UIs.length > 1)
            return;

        var newMap = initMap();
        var newUi = new UI("map-" + UI.counter, maps[maps.length - 1]);
        UIs.push(newUi);
        freeUISlot = newUi;
        if(map.lat === undefined || map.lng === undefined)
        {
            map.pendingMap = newMap;
            return;
        }
    }
    else
    {
        freeUISlot.map.setCenter(new google.maps.LatLng(map.lat, map.lng));
    }

    var positioningOK = freeUISlot.setCircleCenter(x - 10, y - 10);
    if(positioningOK)
        freeUISlot.showCircleInterface();
};
