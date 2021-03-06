"use strict";


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


exports.centroid = centroid;
exports.overlaps = overlaps;
exports.overlaps_any = overlaps_any;
