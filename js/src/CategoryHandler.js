/**
 * Created by andre on 06/12/2016.
 */

var CategoryHandler = function()
{
    this.categories = {};

    this.setCategories = function(categories)
    {
        for(var i = 0; i < categories.length; i++)
        {
            this.categories[categories[i].id] = categories[i];
        }
    };

    this.showCategory = function(id, ui)
    {
        var poisToShow = getPoisByCategoryId(id);

        for(var i = 0; i < poisToShow.length; i++)
        {
            ui.markerFactory.createMarker(poisToShow[i]);
        }

    };

    this.hideCategory = function(id, ui)
    {
        var poisToHide = getPoisByCategoryId(id);

        for(var i = 0; i < poisToHide.length; i++)
        {
            ui.markerFactory.removeMarker(poisToHide[i]);
        }
    };

    function getPoisByCategoryId(id)
    {
        var pois = dataContainer.getPois().results;
        var poisMatching = [];

        for(var i = 0; i < pois.length; i++)
        {
            if(pois[i].category === id)
                poisMatching.push(pois[i]);
        }

        return poisMatching;
    }
};

CategoryHandler.validCategories = [ 1, 3, 5, 6, 7, 8 ];
