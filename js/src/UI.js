var UI = function(id, map)
{
    var mapContainer = $("#" + id);
    this.id = id;
    this.circleVisibility = false;
    this.circleCenter = { x : null, y : null };
    this.currentPoi = null;
    this.currenSlideShowIdx = 0;
    this.radius = null;
    this.markerFactory = new MarkerFactory(map, this);
    this.map = map;
    this.overlayVisibility = false;
    this.imageViewer = null;

    const THRESHOLD_LEFT = 0;
    const THRESHOLD_RIGHT = 50;
    const THRESHOLD_TOP = 15;
    const THRESHOLD_BOTTOM = 50;

    var idPrefix = "UI-" + UI.counter++;
    var root, overlay, yt_container, iFrameYouTube, modelContainer, panoramaContainer, iFrameModel, iFramePanorama, html5VideoContainer;
    var handle;
    var player; // YouTube player
    var handle_center_offset_x, handle_center_offset_y;
    var divBox, divPopCircle, ulPopCircleCategories, ulPopCircleInner, divTrigger, innerButtons, imgCounter;

    var hasVideo, hasModel, hasPanorama, multiChannelAudioStream;

    (function createDOMNodes(that)
    {
        root = $(document.createElement("div")).attr("id", idPrefix).addClass("ui-root").on("mousedown", function() { console.log("mousedown");});
        divBox = $(document.createElement("div")).addClass("box");
        divPopCircle = $(document.createElement("div")).addClass("popcircle");
        ulPopCircleCategories = $(document.createElement("ul")).attr("id", idPrefix + "_categoryPops");
        ulPopCircleInner = $(document.createElement("ul")).attr("id", idPrefix + "_innerPops");
        divTrigger = $(document.createElement("div")).addClass("trigger");

        divBox.append(divTrigger).append(divPopCircle.append(ulPopCircleCategories).append(ulPopCircleInner)).append();
        root.append(divBox);

        for(var i = 0; i < CategoryHandler.validCategories.length; i++)
        {
            var category = CategoryHandler.validCategories[i];
            //var img = $(document.createElement("img")).attr({"id" : idPrefix + "_category_" + category, "src" : UI.categoryImageBindings[category] }).addClass("uiButton outer").css(UI.buttonStyles[i]);
            var img = $(document.createElement("img")).attr({"id" : idPrefix + "_category_" + category, "src" : UI.categoryImageBindings[category] }).addClass("uiButton outer");
            //root.append(img);
            EventListener.bindCategoryButton(that, img, category);
            var li = $(document.createElement("li")).append(img);
            ulPopCircleCategories.append(li);
        }

        var j = CategoryHandler.validCategories.length;
        innerButtons = {};
        for(var i in UI.typeImageBindings)
        {
            var img = $(document.createElement("img")).attr({"id" : idPrefix + "_" + i, "src" : UI.typeImageBindings[i] })
            if(i !== "close" && i !== "move")
            {
                if(i === "next" || i === "prev")
                {
                    img.addClass("uiButton slideShow");
                    img.css({ left : "-10%", top : i === "next" ? "30%" : "50%"});
                    root.append(img);
                    img.hide();
                }
                else
                {
                    img.addClass("uiButton inner");
                    innerButtons[i] = img;
                }
            }
            else
            {
                var className;
                className = "uiButton";
                if(i === "move")
                {
                    className += " draggable";
                    handle = img;
                }
                img.addClass(className).css(UI.buttonStyles[j]);
                root.append(img);
            }

            j++;

            interact("#" + idPrefix + ' .draggable')
                .draggable({
                    // enable inertial throwing
                    inertia: true,
                    // keep the element within the area of it's parent
                    /*restrict: {
                        restriction: "self",
                        endOnly: false,
                        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                    },*/
                    // enable autoScroll
                    autoScroll: false,

                    onstart: function(event)
                    {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    },
                    // call this function on every dragmove event
                    onmove: dragMoveListener,
                    // call this function on every dragend event
                    onend: function (event) {
                    }
                });


            function dragMoveListener (event)
            {
                var target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                var rootPos = root.position();

                //console.log(event.dx, event.dy)
                if(rootPos.left + event.dx - THRESHOLD_LEFT< 0 || rootPos.left + UI.size + event.dx + THRESHOLD_RIGHT > window.innerWidth
                || rootPos.top + event.dy - THRESHOLD_TOP < 0 || rootPos.top + UI.size + event.dy + THRESHOLD_BOTTOM > window.innerHeight)
                {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return;
                }

                // Screen cordinates are OK, but let's avoid intersections between different UIs!
                for(var i = 0; i < UIs.length; i++)
                {
                    if(UIs[i] === that || UIs[i].circleVisibility === false)
                        continue;
                    console.log(Utils.pointDistance(that.circleCenter, UIs[i].circleCenter));
                    if(Utils.pointDistance({ x : that.circleCenter.x + event.dx, y : that.circleCenter.y + event.dy}, UIs[i].circleCenter) < UI.size + 50)
                    {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return;
                    }
                }

                // translate the element
                //target.style.webkitTransform =
                //    target.style.transform =
                //        'translate(' + x + 'px, ' + y + 'px)';

                // update the posiion attributes
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);

                $(root).css({ left : rootPos.left + event.dx, top : rootPos.top + event.dy });
                $(mapContainer).css({ left : rootPos.left + event.dx, top : rootPos.top + event.dy });
                $(root).css({ left : rootPos.left + event.dx});
                //$(mapContainer).css({ left : rootPos.left + event.dx });
                that.circleCenter.x = rootPos.left + event.dx + UI.size / 2 + 20;
                that.circleCenter.y = rootPos.top + event.dy + UI.size / 2 + 20;

                if(multiChannelAudioStream)
                {
                    multiChannelAudioStream.setX((that.circleCenter.x) / window.innerWidth);
                }
                if(that.overlayVisibility === false)
                {
                    var newMapCenter = point2LatLng(new google.maps.Point(that.circleCenter.x - 10, that.circleCenter.y - 10), window.map);

                    that.map.setCenter(newMapCenter);
                }
            }

            EventListener.bind2ndLevelButton(that, img, i);
            //root.append(img);
        }

        overlay = $(document.createElement("div")).attr("id", idPrefix + "_overlay").addClass("uiOverlay").hide();
        yt_container = $(document.createElement("div")).addClass("yt-cont");
        //iFrameYouTube = $(document.createElement("div")).attr("id", idPrefix + "_videoContainer");
        modelContainer = $(document.createElement("div")).attr("id", idPrefix + "_modelContainer").addClass("model-container").hide();
        panoramaContainer = $(document.createElement("div")).attr("id", idPrefix + "_panoramaContainer").addClass("panorama-container").hide();
        iFrameModel = $(document.createElement("iframe")).attr("id", idPrefix + "_model");
        iFramePanorama = $(document.createElement("iframe")).attr("id", idPrefix + "_panorama").css({ "width" : "150%", "height" : "150%" });

        //overlay.append(yt_container.append(iFrameYouTube));
        //overlay.append(yt_container.append(html5VideoContainer));
        overlay.append(yt_container);
        overlay.append(modelContainer.append(iFrameModel));
        overlay.append(panoramaContainer.append(iFramePanorama));
        $("#staticMapContainer").append(root.append(overlay));
    })(this);

    this.showCircleInterface = function()
    {
        //var map = $("#map");

        this.map.setZoom(window.map.getZoom());
        mapContainer.css({ opacity : 1 });
        mapContainer.show();
        this.circleVisibility = true;

        this.showButtons();
    };

    this.hideCircleInterface = function()
    {
        mapContainer.hide();
        this.hideButtons();
        this.hideOverlay();
        this.hideArrows();
        this.circleVisibility = false;
        if(player)
            player.stopVideo();

        /*for(var i = 0; i < UIs.length; i++)
            if(UIs[i] === this)
            {
                UIs.splice(i, 1);
            }
        for(var i = 0; i < maps.length; i++)
            if(maps[i] === map)
                maps.splice(i, 1);
        mapContainer.remove()
        root.remove();*/
    };

    this.setCircleCenter = function(x, y)
    {
        x = x.clamp(UI.size / 2 + THRESHOLD_LEFT, window.innerWidth - UI.size / 2 - THRESHOLD_RIGHT);
        y = y.clamp(UI.size / 2 + THRESHOLD_TOP, window.innerHeight - UI.size / 2 - THRESHOLD_BOTTOM);

        this.circleCenter = { x : x, y : y };

        for(var i = 0; i < UIs.length; i++)
        {
            if(UIs[i] === this || UIs[i].circleVisibility === false)
                continue;
            //console.log(Utils.pointDistance(this.circleCenter, UIs[i].circleCenter));
            if(Utils.pointDistance(this.circleCenter, UIs[i].circleCenter) < UI.size + 50)
            {
                this.hideCircleInterface();
                //event.preventDefault();
                //event.stopImmediatePropagation();
                return false;
            }
        }



        mapContainer.css({ "left" : x - UI.size / 2, "top" : y - UI.size / 2 });
        this.radius = UI.size / 2;

        return true;

    };

    this.showButtons = function()
    {

        var mapPosition = mapContainer.position();

        root.css({ left : mapPosition.left, top : mapPosition.top, width : mapContainer.width(), height : mapContainer.height() });
        root.show();

        divPopCircle.css({ left : 0, top : 0 });
        divTrigger.css({ left : 0, top : 0 });
        ulPopCircleCategories.find("li").each(function()
        {
            var $this = $(this);
            $this.css({ left : UI.size / 2 - $this.width() / 2, top : UI.size / 2  - $this.height() / 2});
        });
        $.popcircle('#' + idPrefix + '_categoryPops',{
                spacing:'50%',
                type:'half', // full, half, quad
                offset:5,	// 0, 1, 2, 3, 4, 5, 6, 7 or 5.1
                ease:'easeOutQuad',
                time:'fast' // slow, fast, 1000
            }
        );

        return;

        root.find(".outer").show();

        var handlePos = handle.position();
        handle_center_offset_x = this.circleCenter.x - handlePos.left;
        handle_center_offset_y = this.circleCenter.y - handlePos.top;
    };

    this.hideButtons = function()
    {
        root.hide();
    };

    this.showOverlay = function()
    {
        //root.find(".outer").hide();
        overlay.show();

        //root.find(".inner").show();
        $.popcircle('#' + idPrefix + '_categoryPops',{
                spacing:'50%',
                type:'half', // full, half, quad
                offset:5,	// 0, 1, 2, 3, 4, 5, 6, 7 or 5.1
                ease:'easeOutQuad',
                time:'fast' // slow, fast, 1000
            }
        );

        ulPopCircleCategories.hide();

        ulPopCircleInner.find('li').each(function() { $(this).detach(); });
        ulPopCircleInner.show();
        ulPopCircleInner.append($(document.createElement("li")).append(innerButtons["text"]));
        var images = dataContainer.getPoiImages(this.currentPoi.id);
        if(images.length > 0)
            ulPopCircleInner.append($(document.createElement("li")).append(innerButtons["photo"]));
        if(hasVideo)
        {
            ulPopCircleInner.append($(document.createElement("li")).append(innerButtons["video"]));
        }
        if(hasModel)
        {
            ulPopCircleInner.append($(document.createElement("li")).append(innerButtons["3D"]));
        }
        if(hasPanorama)
        {
            ulPopCircleInner.append($(document.createElement("li")).append(innerButtons["globe"]));
        }

        ulPopCircleInner.find("li").each(function()
        {
            var $this = $(this);
            $this.css({ left : UI.size / 2 - $this.width() / 2, top : UI.size / 2  - $this.height() / 2});
        });

        $.popcircle('#' + idPrefix + '_innerPops',{
                spacing:'50%',
                type:'quad', // full, half, quad
                offset:5,	// 0, 1, 2, 3, 4, 5, 6, 7 or 5.1
                ease:'easeOutQuad',
                time:'fast' // slow, fast, 1000
            }
        );

        this.overlayVisibility = true;
    };

    this.hideOverlay = function()
    {
        hasModel = false;
        hasPanorama = false;
        hasVideo = false;

        overlay.hide();

        $.popcircle('#' + idPrefix + '_innerPops',{
                spacing:'50%',
                type:'quad', // full, half, quad
                offset:5,	// 0, 1, 2, 3, 4, 5, 6, 7 or 5.1
                ease:'easeOutQuad',
                time:'fast' // slow, fast, 1000
            }
        );

        ulPopCircleInner.hide();

        ulPopCircleCategories.show();
        $.popcircle('#' + idPrefix + '_categoryPops',{
                spacing:'50%',
                type:'half', // full, half, quad
                offset:5,	// 0, 1, 2, 3, 4, 5, 6, 7 or 5.1
                ease:'easeOutQuad',
                time:'fast' // slow, fast, 1000
            }
        );
        //root.find(".inner").hide();
        this.overlayVisibility = false;
        //root.find(".outer").show();
        //if(player)
        //    player.stopVideo();
        if(html5VideoContainer)
            html5VideoContainer[0].pause();

        this.hideArrows();
        root.find(".img-counter").remove();
    };

    this.getCurrImageSize = function()
    {
        var staticMap = $("#staticMap");

        return { "width" : staticMap.width(), "height" : staticMap.height() };
    };

    this.printPoiText = function()
    {
        var poi = this.currentPoi;
        var name = poi.name;
        var description = poi.desc;

        this.clearOverlay();

        var textInfoContainer = $(document.createElement("p")).addClass("uiOverlayData");
        textInfoContainer.append($(document.createElement("h2")).addClass("uiTitle").text(name)).append($(document.createElement("p")).text(description).addClass("uiText"));

        textInfoContainer.on("touchstart", function(ev)
        {
            this.currentScroll = $(this).scrollTop();
            this.touchStartY = ev.targetTouches[0].pageY;
        });
        textInfoContainer.on("touchmove", function(ev)
        {
            $(this).scrollTop(this.currentScroll + this.touchStartY - ev.targetTouches[0].pageY);

        });
        overlay.append(textInfoContainer);
    };

    function fitContainerAndPreserveRatio(imgContainer, img)
    {
        var width = img[0].width;
        var height = img[0].height;
        var newWidth, newHeight;

        newHeight = imgContainer.height();
        newWidth = (newHeight * width) / height;

        if(newWidth < imgContainer.width()) // we're forced to stretch the image in this case
            newWidth = imgContainer.width();

        img.css({ width : newWidth, height : newHeight });

    }

    this.showPoiImages = function()
    {
        var imgContainer = $(document.createElement("div")).addClass("uiOverlayImg").attr("id", idPrefix + "_imgContainer");

        this.currenSlideShowIdx = 0;
        var images = dataContainer.getPoiImages(this.currentPoi.id);

        if(!images.length)
            return;

        this.clearOverlay();
        //imgContainer.css({"background-image" : "url(" + images[this.currenSlideShowIdx].file + ")", "background-size" : "cover", "background-position" : "center", "background-repeat" : "no-repeat" });
        //var img = $(document.createElement("img")).attr("src", images[this.currenSlideShowIdx].file);
        //imgContainer.append(img);
        //img.ImageViewer();


        var that = this;
        var img = $(document.createElement("img")).attr({"src" : images[this.currenSlideShowIdx].file, "id" : idPrefix + "_currImg"}).on("load", function()
        {
            // wait for the image to be loaded, we need the real size of the image in order to preserve its ratio
            imgContainer.append(img);
            fitContainerAndPreserveRatio(imgContainer, img);
            img.ImageViewer({ snapView : false });
            that.imageViewer = img.data("ImageViewer");
            console.log(that.imageViewer);

            imgCounter = new ImgCounter(images.length);
            root.append(imgCounter.DOMelem);
        });


        var that = this;
        var hammer = new Hammer(imgContainer[0]);
        hammer.on("swipe", function(ev)
        {
            ev.srcEvent.preventDefault();
            ev.srcEvent.stopImmediatePropagation();

            if(that.imageViewer.zoomValue > 100)
                return;

            const LEFT = 2;
            const RIGHT = 4;

            switch (ev.direction)
            {
                case RIGHT:
                    that.prevImage();
                    break;
                case LEFT:
                    that.nextImage();
                    break;

            }
        });

        overlay.append(imgContainer);
        //this.showArrows();

    };

    this.showEmbeddedYouTubeVideo = function(autoplay)
    {
        var video = dataContainer.getPoiVideo(this.currentPoi.id);
        if(!video)
            return;
        this.clearOverlay();
        yt_container.show();

        if(autoplay)
            this.playVideo();
    };

    this.preloadVideoFromServer = function()
    {
        var video = dataContainer.getPoiVideo(this.currentPoi.id);

        if(!video)
            return;

        hasVideo = true;

        var that = this;
       // var videoElem = $("<video width='100%' height='100%' controls></video>");

        html5VideoContainer = $("<video loop width='100%' height='100%'></video>").attr("id", idPrefix + "_videoContainer").on("touchstart", function(ev)
        {
            ev.preventDefault();


            if(this.paused)
                that.playVideo();
            else
                that.pauseVideo();
        });

        var videoSrc = $("<source src='" + video.url + "' type='video/mp4'>");

        yt_container.empty().append(html5VideoContainer.append(videoSrc));

        yt_container.append($("<img class='playIcon' src='res/images/icon_playVideo.png' />"));


        multiChannelAudioStream = new AudioStreamMultiChannel(html5VideoContainer[0], "video", 4);
        multiChannelAudioStream.setX(this.circleCenter.x);
    };

    this.preLoadEmbeddedYouTubeVideo = function()
    {
        var video = dataContainer.getPoiVideo(this.currentPoi.id);

        if(!video)
            return;

        hasVideo = true;

        var correctUrl = video.url.replace("watch?v=", "embed/");
        correctUrl += "?enablejsapi=1";

        var videoId = video.url.split("v=")[1];

        if(!player)
        {
            try
            {
                player = new YT.Player(idPrefix + "_videoContainer",
                    {
                        height: '100%',
                        width: '100%',
                        videoId: video.url.split("v=")[1]
                    });
            }
            catch(ex) { console.log(ex); }
        }
        else
        {
            $("#" + idPrefix + "_videoContainer").attr("src", correctUrl);
        }

        //overlay.empty().append(videoContainer);
    };

    this.show3dModel = function()
    {
        if(this.currentPoi.sketchfabUrl === "")
            return;

        this.clearOverlay();

        modelContainer.show();
    };

    this.showPanorama = function()
    {
        if(this.currentPoi.panoramicUrl === "")
            return;

        this.clearOverlay();

        panoramaContainer.show();
    };

    this.preload3dModel = function()
    {
        if(this.currentPoi.sketchfabUrl === "")
            return;

        hasModel = true;
        var fullUrl = "https://sketchfab.com/models/" + this.currentPoi.sketchfabUrl + "/embed";

        iFrameModel.attr("src", fullUrl);
    };

    this.preloadPanoramicImage = function()
    {
        if(this.currentPoi.panoramicUrl === "")
            return;

        hasPanorama = true;

        const TEMP_URL = "http://www.airpano.ru/files/Yamal-Russia/2-3-2";
        iFramePanorama.attr("src", TEMP_URL);
    };

    this.clearOverlay = function()
    {
        root.find(".uiOverlayData").remove();
        root.find(".uiOverlayImg").remove();
        root.find(".img-counter").remove();

        yt_container.hide();
        modelContainer.hide();
        panoramaContainer.hide();
        this.hideArrows();
        //if(player && player.stopVideo)
        //    player.stopVideo();
        if(html5VideoContainer)
            this.pauseVideo();
    };

    this.showArrows = function()
    {
        root.find(".slideShow").show();
    };

    this.hideArrows = function()
    {
        root.find(".slideShow").hide();
    };

    this.nextImage = function()
    {
        var images = dataContainer.getPoiImages(this.currentPoi.id);

        if(this.currenSlideShowIdx < images.length - 1)
        {
            var imgContainer = $("#" + idPrefix + "_imgContainer");
            imgContainer.empty();

            var that = this;
            var img = $(document.createElement("img")).attr({"src" : images[++this.currenSlideShowIdx].file }).on("load", function()
            {
                // wait for the image to be loaded, we need the real size of the image in order to preserve its ratio
                imgContainer.append(img);
                fitContainerAndPreserveRatio(imgContainer, img);
                img.ImageViewer({ snapView : false });
                that.imageViewer = img.data("ImageViewer");

                imgCounter.next();
            });
        }
            //$("#" + idPrefix + "_currImg").attr("src", images[++this.currenSlideShowIdx].file);

    };

    this.prevImage = function()
    {
        var images = dataContainer.getPoiImages(this.currentPoi.id);

        if(this.currenSlideShowIdx > 0)
        {
            var imgContainer = $("#" + idPrefix + "_imgContainer");
            imgContainer.empty();
            var that = this;
            var img = $(document.createElement("img")).attr({"src" : images[--this.currenSlideShowIdx].file }).on("load", function()
            {
                // wait for the image to be loaded, we need the real size of the image in order to preserve its ratio
                imgContainer.append(img);
                fitContainerAndPreserveRatio(imgContainer, img);
                img.ImageViewer({ snapView : false });
                that.imageViewer = img.data("ImageViewer");
                imgCounter.prev();
            });
        }
            //$("#" + idPrefix + "_currImg").attr("src", images[--this.currenSlideShowIdx].file);
            //$("#" + idPrefix + "_imgContainer").css("background-image", "url(" + images[--this.currenSlideShowIdx].file + ")");
    };

    function point2LatLng(point, map)
    {
        var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
        var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
        var scale = Math.pow(2, map.getZoom());
        var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
        return map.getProjection().fromPointToLatLng(worldPoint);
    }

    this.pauseVideo = function()
    {
        root.find(".playIcon").show();
        html5VideoContainer[0].pause();
    };

    this.playVideo = function()
    {
        root.find(".playIcon").hide();
        html5VideoContainer[0].play();
    };

    var that = this;

    function ImgCounter(totalImages)
    {
        var currIdx = 1;
        this.DOMelem = $("<span class='img-counter'>1/" + totalImages + "</span>");

        this.next = function()
        {
            if(currIdx === totalImages)
                return;
            currIdx++;
            this.update();
        };

        this.prev = function()
        {
            if(currIdx === 0)
                return;
            currIdx--;
            this.update();
        };

        this.update = function()
        {
            this.DOMelem.text(currIdx + " / " + totalImages);
            const WIDTH = 35;
            this.DOMelem.css({"margin-left": -UI.size / 2 - WIDTH / 2, "margin-top": 9 * UI.size / 10});
        };

        this.update();
    }
};

UI.buttonStyles =
{
    0 : { left : "70%", top : "0%" },
    1 : { left : "85%", top : "17%" },
    2 : { left : "90%", top : "40%" },
    3 : { left : "85%", top : "63%" },
    4 : { left : "70%", top : "80%" },
    5 : { left : "50%", top : "90%" },
    6 : { left : "7%", top : "0%" },
    7 : { left : "70%", top : "0%" },
    8 : { left : "85%", top : "17%" },
    9 : { left : "90%", top : "40%" },
    10 : { left : "85%", top : "63%" },
    11 : { left : "70%", top : "80%" },
    12 : { left : "-10%", top : "30%" },
    13 : { left : "-10%", top : "50%" },
    14 : { left : "7%", top : "80%" }
};

UI.categoryImageBindings =
{
    1 : "res/images/testRestaurant.png",
    3 : "res/images/testTemple.png",
    5 : "res/images/testParking.png",
    6 : "res/images/testHotel.png",
    7 : "res/images/testCarousel.png",
    8 : "res/images/testBeach.png"
};

UI.typeImageBindings =
{
    "close" : "res/images/testClose.png",
    "text" : "res/images/testText.png",
    "photo" : "res/images/testPhoto.png",
    "video" : "res/images/testVideo.png",
    "3D" : "res/images/test3D.png",
    "globe" : "res/images/testGlobe.png",
    "next" : "res/images/testNextImage.png",
    "prev" : "res/images/testPrevImage.png",
    "move" : "res/images/testMove.png"
};

UI.getInstanceById = function(id)
{
    for(var i = 0; i < UIs.length; i++)
    {
        if(UIs[i].id === id)
            return UIs[i];
    }

    return null;
};

UI.counter = 0;

UI.managePinch = function (elm) {
    var hammertime = new Hammer(elm, {});
    hammertime.get('pinch').set({
        enable: true
    });
    var posX = 0,
        posY = 0,
        scale = 1,
        last_scale = 1,
        last_posX = 0,
        last_posY = 0,
        max_pos_x = 0,
        max_pos_y = 0,
        transform = "",
        el = elm;

    hammertime.on('doubletap pan pinch panend pinchend', function(ev) {
        if (ev.type == "doubletap") {
            transform =
                "translate3d(0, 0, 0) " +
                "scale3d(2, 2, 1) ";
            scale = 2;
            last_scale = 2;
            try {
                if (window.getComputedStyle(el, null).getPropertyValue('-webkit-transform').toString() != "matrix(1, 0, 0, 1, 0, 0)") {
                    transform =
                        "translate3d(0, 0, 0) " +
                        "scale3d(1, 1, 1) ";
                    scale = 1;
                    last_scale = 1;
                }
            } catch (err) {}
            el.style.webkitTransform = transform;
            transform = "";
        }

        //pan
        if (scale != 1) {
            posX = last_posX + ev.deltaX;
            posY = last_posY + ev.deltaY;
            max_pos_x = Math.ceil((scale - 1) * el.clientWidth / 2);
            max_pos_y = Math.ceil((scale - 1) * el.clientHeight / 2);
            if (posX > max_pos_x) {
                posX = max_pos_x;
            }
            if (posX < -max_pos_x) {
                posX = -max_pos_x;
            }
            if (posY > max_pos_y) {
                posY = max_pos_y;
            }
            if (posY < -max_pos_y) {
                posY = -max_pos_y;
            }
        }


        //pinch
        if (ev.type == "pinch") {
            scale = Math.max(.999, Math.min(last_scale * (ev.scale), 4));
        }
        if(ev.type == "pinchend"){last_scale = scale;}

        //panend
        if(ev.type == "panend"){
            last_posX = posX < max_pos_x ? posX : max_pos_x;
            last_posY = posY < max_pos_y ? posY : max_pos_y;
        }

        if (scale != 1) {
            transform =
                "translate3d(" + posX + "px," + posY + "px, 0) " +
                "scale3d(" + scale + ", " + scale + ", 1)";
        }

        if (transform) {
            el.style.webkitTransform = transform;
        }
    });
};


