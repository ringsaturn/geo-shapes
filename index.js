"use strict";
const EARTH_RADIUS = 6371008.8;

function centroid(a) {
  /* Optimization: the centroid of a point is, well, a point; so simply return
   * it as-is in order to prevent an allocation from being necessary. */
  if(a.length <= 2) {
    return a;
  }

  /* The centroid is merely the average of all the coordinates of a shape. */
  let x = 0;
  let y = 0;
  let n = 0;
  for(let i = a.length; i; ) {
    n ++;
    y += (a[--i] - y) / n;
    x += (a[--i] - x) / n;
  }
  return [x, y];
}

/* Overlap test that works for any combination of points and boxes. */
function box_box(a, b) {
  const m = a.length,
        n = b.length;
  return a[0] <= b[n - 2] && a[1] <= b[n - 1] &&
         a[m - 2] >= b[0] && a[m - 1] >= b[1];
}

/* A point and a polygon overlap if the point is within the polygon.
 * See: http://paulbourke.net/geometry/polygonmesh/#insidepoly */
function polygon_point(a, b) {
  let contains = false,
      x1 = a[0],
      y1 = a[1],
      x2 = NaN,
      y2 = NaN;
  const x = b[0],
        y = b[1];

  for(let i = a.length; i; ) {
    y2 = y1;
    x2 = x1;

    y1 = a[--i];
    x1 = a[--i];

    if(((y1 <= y && y < y2) || (y2 <= y && y < y1)) &&
       (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)) {
      contains = !contains;
    }
  }

  return contains;
}

function polygon_polygon(a, b) {
  /* A point of B is wholly within A. */
  if(polygon_point(a, b)) {
    return true;
  }

  /* A point of A is wholly within B. */
  if(polygon_point(b, a)) {
    return true;
  }

  /* Any edge of A and B cross. */
  let ax1 = a[0],
      ay1 = a[1],
      ax2 = NaN,
      ay2 = NaN;
  for(let i = a.length; i; ) {
    ay2 = ay1;
    ax2 = ax1;
    ay1 = a[--i];
    ax1 = a[--i];

    let bx1 = b[0],
        by1 = b[1],
        bx2 = NaN,
        by2 = NaN;
    for(let j = b.length; j; ) {
      by2 = by1;
      bx2 = bx1;
      by1 = b[--j];
      bx1 = b[--j];

      if(((by1 - ay1) * (ax2 - ax1) > (bx1 - ax1) * (ay2 - ay1)) !==
         ((by2 - ay1) * (ax2 - ax1) > (bx2 - ax1) * (ay2 - ay1)) &&
         ((ay1 - by1) * (bx2 - bx1) > (ax1 - bx1) * (by2 - by1)) !==
         ((ay2 - by1) * (bx2 - bx1) > (ax2 - bx1) * (by2 - by1))) {
        return true;
      }
    }
  }

  return false;
}

/* We cheese out and convert boxes to polygons and use the poly-poly test. */
function polygon_box(a, b) {
  return polygon_polygon(a, [b[0], b[1], b[2], b[1], b[2], b[3], b[1], b[3]]);
}

function overlaps(a, b) {
  if(b.length > a.length) {
    const t = a;
    a = b;
    b = t;
  }

  return (a.length <= 4)? box_box        (a, b):
         (b.length <= 2)? polygon_point  (a, b):
         (b.length <= 4)? polygon_box    (a, b):
                          polygon_polygon(a, b);
}

function overlaps_any(a, bs) {
  for(const b of bs) {
    if(overlaps(a, b)) {
      return true;
    }
  }
  return false;
}

/* distance + bearing below are sourced from
 * http://www.movable-type.co.uk/scripts/latlong.html */
function bearing(lat1, lon1, lat2, lon2) {
  lat1 *= Math.PI / 180.0;
  lon1 *= Math.PI / 180.0;
  lat2 *= Math.PI / 180.0;
  lon2 *= Math.PI / 180.0;

  const dLon = lon2 - lon1;

  return (Math.atan2(
    Math.sin(dLon) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  ) * (180.0 / Math.PI) + 360.0) % 360.0;
}

function distance(lat_1, lon_1, lat_2, lon_2) {
  lat_1 *= Math.PI / 180.0;
  lon_1 *= Math.PI / 180.0;
  lat_2 *= Math.PI / 180.0;
  lon_2 *= Math.PI / 180.0;

  const dLon = lon_2 - lon_1;
  const sinDLon = Math.sin(dLon);
  const cosDLon = Math.cos(dLon);
  const sinLat1 = Math.sin(lat_1);
  const cosLat1 = Math.cos(lat_1);
  const sinLat2 = Math.sin(lat_2);
  const cosLat2 = Math.cos(lat_2);
  const a = cosLat2 * sinDLon;
  const b = cosLat1 * sinLat2 - sinLat1 * cosLat2 * cosDLon;

  return EARTH_RADIUS * Math.atan2(
    Math.sqrt(a * a + b * b),
    sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDLon
  );
}

function distance_any(a, bs) {
  const m = centroid(a);
  let min_dist = EARTH_RADIUS * Math.PI;
  for(const b of bs) {
    const n = centroid(b);
    const dist = distance(m[0], m[1], n[0], n[1]);
    if(dist < min_dist) {
      min_dist = dist;
    }
  }
  return min_dist;
}

exports.EARTH_RADIUS = EARTH_RADIUS;
exports.centroid     = centroid;
exports.overlaps     = overlaps;
exports.overlaps_any = overlaps_any;
exports.bearing      = bearing;
exports.distance     = distance;
exports.distance_any = distance_any;
