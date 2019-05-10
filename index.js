"use strict";
const GeographicLib = require("geographiclib");

function centroid(a) {
  // Optimization: the centroid of a point is, well, a point; so simply return
  // it as-is in order to prevent an allocation from being necessary.
  if(a.length <= 2) {
    return a;
  }

  // The centroid is merely the average of all the coordinates of a shape.
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

// Overlap test that works for any combination of points and boxes.
function box_box(a, b) {
  const m = a.length;
  const n = b.length;
  return a[0] <= b[n - 2] && a[1] <= b[n - 1] && a[m - 2] >= b[0] && a[m - 1] >= b[1];
}

// A point and a polygon overlap if the point is within the polygon.
// See: http://paulbourke.net/geometry/polygonmesh/#insidepoly
function polygon_point(a, b) {
  let contains = false;
  let x1 = a[0];
  let y1 = a[1];
  let x2 = NaN;
  let y2 = NaN;
  const x = b[0];
  const y = b[1];

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
  // A point of B is wholly within A.
  if(polygon_point(a, b)) {
    return true;
  }

  // A point of A is wholly within B.
  if(polygon_point(b, a)) {
    return true;
  }

  // Any edge of A and B cross.
  let ax1 = a[0];
  let ay1 = a[1];
  let ax2 = NaN;
  let ay2 = NaN;
  for(let i = a.length; i; ) {
    ay2 = ay1;
    ax2 = ax1;
    ay1 = a[--i];
    ax1 = a[--i];

    let bx1 = b[0];
    let by1 = b[1];
    let bx2 = NaN;
    let by2 = NaN;
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

// We cheese out and convert boxes to polygons and use the poly-poly test.
function polygon_box(a, b) {
  return polygon_polygon(a, [b[0], b[1], b[2], b[1], b[2], b[3], b[1], b[3]]);
}

function overlaps(a, b) {
  if(b.length > a.length) {
    const t = a;
    a = b;
    b = t;
  }

  if(a.length <= 4) { return box_box(a, b); }
  if(b.length <= 2) { return polygon_point(a, b); }
  if(b.length <= 4) { return polygon_box(a, b); }
  return polygon_polygon(a, b);
}

function overlaps_any(a, bs) {
  for(const b of bs) {
    if(overlaps(a, b)) {
      return true;
    }
  }
  return false;
}


// Convert -180..180 to 0..360.
function angle(x) {
  if(x < 0) {
    x += 360;
  }
  return x;
}

// https://www.govinfo.gov/content/pkg/CFR-2016-title47-vol4/pdf/CFR-2016-title47-vol4-sec73-208.pdf
function fcc_geometry(lat_1, lon_1, lat_2, lon_2) {
  // Cast everything to numbers, just in case.
  lat_1 = +lat_1;
  lon_1 = +lon_1;
  lat_2 = +lat_2;
  lon_2 = +lon_2;

  // https://en.wikipedia.org/wiki/Chebyshev_polynomials
  const cos_0m = 1;
  const cos_1m = Math.cos((lat_1 + lat_2) * (Math.PI / 360));
  const cos_2m = 2 * cos_1m * cos_1m - cos_0m;
  const cos_3m = 2 * cos_1m * cos_2m - cos_1m;
  const cos_4m = 2 * cos_1m * cos_3m - cos_2m;
  const cos_5m = 2 * cos_1m * cos_4m - cos_3m;

  const k_lat = 111132.09 * cos_0m - 566.05 * cos_2m + 1.20 * cos_4m;
  const k_lon = 111415.13 * cos_1m - 94.55 * cos_3m + 0.12 * cos_5m;

  return [k_lon * (lon_2 - lon_1), k_lat * (lat_2 - lat_1)];
}


// Select these functions if you want high accuracy (e.g. to the millimeter).
function distance_accurate(lat_1, lon_1, lat_2, lon_2) {
  return GeographicLib.Geodesic.WGS84.Inverse(
    lat_1,
    lon_1,
    lat_2,
    lon_2,
    GeographicLib.Geodesic.DISTANCE
  ).s12;
}

function bearing_accurate(lat_1, lon_1, lat_2, lon_2) {
  return angle(GeographicLib.Geodesic.WGS84.Inverse(
    lat_1,
    lon_1,
    lat_2,
    lon_2,
    GeographicLib.Geodesic.AZIMUTH
  ).azi1);
}


// Select these functions if you want high speed (they're almost ludicrously
// fast) and if you can guarantee that the distance between the two points is
// relatively small (< ~475km). Error in that region is proportional to the
// distance, but is generally quite low (< ~0.2%).
function distance_fast(lat_1, lon_1, lat_2, lon_2) {
  return Math.hypot(...fcc_geometry(lat_1, lon_1, lat_2, lon_2));
}

function bearing_fast(lat_1, lon_1, lat_2, lon_2) {
  return angle(Math.atan2(...fcc_geometry(lat_1, lon_1, lat_2, lon_2)) * (180 / Math.PI));
}

function distance_and_bearing_fast(lat_1, lon_1, lat_2, lon_2) {
  const [d_lon, d_lat] = fcc_geometry(lat_1, lon_1, lat_2, lon_2);

  return {
    distance: Math.hypot(d_lon, d_lat),
    bearing: angle(Math.atan2(d_lon, d_lat) * (180 / Math.PI)),
  };
}


// Select these functions if you don't have specific accuracy or performance
// needs.
//
// The thresholds for this function were selected by hand by looking at the
// error of the fast distance function over a large number (500k) of test
// locations and finding the point where the error seemed to exceed 0.1%. I
// tried to be pretty conservative... it's likely we could push the boundaries
// a bit further...
function distance(lat_1, lon_1, lat_2, lon_2) {
  // The fast distance function has accuracy issues near the poles.
  if(Math.max(Math.abs(lat_1), Math.abs(lat_2)) < 75) {
    const [d_lon, d_lat] = fcc_geometry(lat_1, lon_1, lat_2, lon_2);
    const t_sq = d_lon * d_lon + d_lat * d_lat;

    // The fast distance function has accuracy issues beyond a certain distance.
    if(t_sq < (330000 * 330000)) {
      return Math.sqrt(t_sq);
    }
  }

  return distance_accurate(lat_1, lon_1, lat_2, lon_2);
}

function bearing(lat_1, lon_1, lat_2, lon_2) {
  // The fast bearing function has accuracy issues near the poles.
  if(Math.max(Math.abs(lat_1), Math.abs(lat_2)) < 75) {
    const [d_lon, d_lat] = fcc_geometry(lat_1, lon_1, lat_2, lon_2);
    const t_sq = d_lon * d_lon + d_lat * d_lat;

    // The fast bearing function has accuracy issues beyond a certain distance.
    if(t_sq < (330000 * 330000)) {
      return angle(Math.atan2(d_lon, d_lat) * (180 / Math.PI));
    }
  }

  return bearing_accurate(lat_1, lon_1, lat_2, lon_2);
}

function distance_any(a, bs) {
  const m = centroid(a);
  let min_dist = Infinity;
  for(const b of bs) {
    const n = centroid(b);
    const dist = distance(m[0], m[1], n[0], n[1]);
    if(dist < min_dist) {
      min_dist = dist;
    }
  }
  return min_dist;
}

exports.EARTH_RADIUS = 6371008.8;
exports.centroid = centroid;
exports.overlaps = overlaps;
exports.overlaps_any = overlaps_any;
exports.distance_accurate = distance_accurate;
exports.bearing_accurate = bearing_accurate;
exports.distance_fast = distance_fast;
exports.bearing_fast = bearing_fast;
exports.distance_and_bearing_fast = distance_and_bearing_fast;
exports.distance = distance;
exports.bearing = bearing;
exports.distance_any = distance_any;
