"use strict";
const GeographicLib = require("geographiclib");

const EARTH_RADIUS = 6371008.8;
const DISTANCE = Symbol();
const AZIMUTH = Symbol();
const ALL = Symbol();


const hypot = Math.hypot;

function wrap(x) {
  if(x < 0) {
    x += 360;
  }
  return x;
}

function atan(y, x) {
  return wrap(Math.atan2(y, x) * (180 / Math.PI));
}


function exact(lat_1, lon_1, lat_2, lon_2, retval=ALL) {
  let flags = 0;
  switch(retval) {
    case DISTANCE: flags = GeographicLib.Geodesic.DISTANCE; break;
    case AZIMUTH: flags = GeographicLib.Geodesic.AZIMUTH; break;
    case ALL: flags = GeographicLib.Geodesic.DISTANCE | GeographicLib.Geodesic.AZIMUTH; break;
    default: throw new RangeError("expected one of DISTANCE, AZIMUTH, ALL");
  }

  const {s12, azi1} = GeographicLib.Geodesic.WGS84.Inverse(lat_1, lon_1, lat_2, lon_2, flags);
  switch(retval) {
    case DISTANCE: return s12;
    case AZIMUTH: return wrap(azi1);
    case ALL: return {distance: s12, azimuth: wrap(azi1)};
  }
}

function approximate(lat_1, lon_1, lat_2, lon_2, retval=ALL) {
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

  const d_lat = k_lat * (lat_2 - lat_1);
  const d_lon = k_lon * (lon_2 - lon_1);

  switch(retval) {
    case DISTANCE: return hypot(d_lon, d_lat);
    case AZIMUTH: return atan(d_lon, d_lat);
    case ALL: return {distance: hypot(d_lon, d_lat), azimuth: atan(d_lon, d_lat)};
    default: throw new RangeError("expected one of DISTANCE, AZIMUTH, ALL");
  }
}


exports.EARTH_RADIUS = EARTH_RADIUS;
exports.DISTANCE = DISTANCE;
exports.AZIMUTH = AZIMUTH;
exports.ALL = ALL;

exports.exact = exact;
exports.approximate = approximate;
