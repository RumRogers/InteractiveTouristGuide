/**
 * Created by andre on 06/12/2016.
 */

var DataContainer = function()
{
    var SERVER_VIDEOS_PATH = "res/videos/";
    const VIDEO_EXTENSION = ".mp4";

    if(location.origin.indexOf("localhost") === -1)
    {
        SERVER_VIDEOS_PATH = "http://vps246293.ovh.net/swresources/videos/touristguide/";
    }

    var categories,
        pois,
        images,
        videos,
        models,
        mapPoiImages,
        mapPoiVideo,
        mapPoiModels,
        categoryIcons =
        {
            1 : "res/images/markerRestaurant.png",
            3 : "res/images/markerTemple.png",
            5 : "res/images/markerParking.png",
            6 : "res/images/markerHotel.png",
            7 : "res/images/markerCarousel.png",
            8 : "res/images/markerBeach.png"
        };

    this.setCategories = function(data)
    {
        categories = data;

        return;
        categoryIcons = {};

        for(var i = 0; i < categories.results.length; i++)
        {
            var category = categories.results[i];

            categoryIcons[category.id] = category.icon;
        }
    };

    this.setPois = function(data)
    {
        pois = data;
        $.getScript("http://followme.crs4.it:8080/videos?callback=dataContainer.setVideos");
    };

    this.setImages = function(data)
    {
        images = {};
        mapPoiImages = {};

        for(var i = 0; i < data.results.length; i++)
        {
            var img = data.results[i];

            images[img.id] = img;

            mapPoiImages[img.poi] = mapPoiImages[img.poi] || [];
            mapPoiImages[img.poi].push(img);
        }
    };

    this.getPoi = function(id)
    {
        for(var i = 0; i < pois.results.length; i++)
            if(pois.results[i].id === id)
                return pois.results[i];

        return null;
    };

    this.setVideos = function(data)
    {
        videos = {};
        mapPoiVideo = {};

        for(var i = 0; i < data.results.length; i++)
        {
            var video = data.results[i];
            var videoId = video.url.split("v=")[1];
            video.id = videoId;
            video.url = SERVER_VIDEOS_PATH + video.id + VIDEO_EXTENSION;

            videos[video.id] = video;
            mapPoiVideo[video.poi] = video;
        }

        for(var i = 0; i < pois.results.length; i++)
        {
            var poi = pois.results[i];

            if(poi.youtubeId !== "" || poi.youtubeUrl !== "")
            {
                var url,
                    id;
                if(poi.youtubeId !== "")
                {
                    //url = "https://www.youtube.com/watch?v=" + poi.youtubeId;
                    id = poi.youtubeId;

                }
                else
                {

                    // url = poi.youtubeUrl;
                    id = poi.youtubeUrl.split("v=")[1];
                }

                url = SERVER_VIDEOS_PATH + id + VIDEO_EXTENSION;

                var reconstructObject = { "id" : id, "url" : url, "poi" : poi.id };
                videos[reconstructObject.id] = reconstructObject;
                mapPoiVideo[reconstructObject.poi] = reconstructObject;
            }
        }
    };

    this.getCategories = function() { return categories; };
    this.getPois = function() { return pois; };
    this.getImages = function() { return images; };
    this.getCategoryIcon = function(id) { return categoryIcons[id]; };

    this.getPoiVideo = function(poiId)
    {
        return mapPoiVideo[poiId] || null;
    };

    this.getPoiImages = function(poiId)
    {
        if(mapPoiImages[poiId])
            return mapPoiImages[poiId];
        return [];
    };

    this.getVideos = function()
    {
        return videos;
    }
};