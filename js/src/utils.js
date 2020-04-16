/**
 * Created by andre on 22/12/2016.
 */

Number.prototype.clamp = function(min, max)
{
    return Math.min(Math.max(this, min), max);
};

Utils = {};
Utils.pointInTriangle = function(p, v1, v2, v3)
{
    function sign(p1, p2, p3)
    {
        console.log((p1.x - p3.x) * (p2.y - p3.y) * (p1.y - p3.y));
        return (p1.x - p3.x) * (p2.y - p3.y) * (p1.y - p3.y);
    }

    var b1 = sign(p, v1, v2) < 0;
    var b2 = sign(p, v2, v3) < 0;
    var b3 = sign(p, v3, v1) < 0;

    return ((b1 === b2) && (b2 === b3));
};

Utils.pointDistance = function(p1, p2)
{
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
};

Utils.test = function(x, y, points)
{
    var v1 = { x : points[0], y : points[1] };
    var v2 = { x : points[2], y : points[3] };
    var v3 = { x : points[4], y : points[5] };

    return Utils.pointInTriangle({ x : x, y : y}, v1, v2, v3);
};