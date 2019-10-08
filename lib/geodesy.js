"use strict";
const GeographicLib = require("geographiclib");

const EARTH_RADIUS = 6371008.8;


function exact(lat_1, lon_1, lat_2, lon_2) {
  const {s12, azi1} = GeographicLib.Geodesic.WGS84.Inverse(
    lat_1,
    lon_1,
    lat_2,
    lon_2,
    GeographicLib.Geodesic.DISTANCE | GeographicLib.Geodesic.AZIMUTH
  );

  return {
    distance: s12,
    azimuth: (azi1 + 360) % 360,
  };
}

// https://www.govinfo.gov/content/pkg/CFR-2016-title47-vol4/pdf/CFR-2016-title47-vol4-sec73-208.pdf
function approximate(lat_1, lon_1, lat_2, lon_2) {
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

  return {
    distance: Math.sqrt(d_lat * d_lat + d_lon * d_lon),
    azimuth: (Math.atan2(d_lon, d_lat) * (180 / Math.PI) + 360) % 360,
  };
}

// This function is nearly identical to the above one, but it only returns the
// square of the distance. It is suitable for applications requiring modest
// accuracy and great speed.
function distance_sq(lat_1, lon_1, lat_2, lon_2) {
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

  return d_lat * d_lat + d_lon * d_lon;
}


exports.EARTH_RADIUS = EARTH_RADIUS;

exports.exact = exact;
exports.approximate = approximate;
exports.distance_sq = distance_sq;
