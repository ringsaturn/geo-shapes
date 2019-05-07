"use strict";
const expect     = require("chai").expect;
const geoshapes  = require("./index");

describe("geo-shapes", () => {
  describe("overlaps", () => {
    it("should return false for two points that don't match", () => {
      expect(geoshapes.overlaps([0, 1], [1, 0])).to.equal(false);
    });

    it("should return true for two points that match", () => {
      expect(geoshapes.overlaps([0, 1], [0, 1])).to.equal(true);
    });


    it("should return false for a point outside of a box", () => {
      expect(geoshapes.overlaps([-1, -1, +1, +1], [2, 0])).to.equal(false);
      expect(geoshapes.overlaps([2, 0], [-1, -1, +1, +1])).to.equal(false);
    });

    it("should return true for a point inside of a box", () => {
      expect(geoshapes.overlaps([-1, -1, +1, +1], [0, 0])).to.equal(true);
      expect(geoshapes.overlaps([0, 0], [-1, -1, +1, +1])).to.equal(true);
    });

    it("should return false for two boxes that don't overlap", () => {
      expect(geoshapes.overlaps([-2, -2, -1, -1], [1, 1, 2, 2])).
        to.equal(false);
    });

    it("should return true for two boxes that overlap", () => {
      expect(geoshapes.overlaps([-1, -1, 0, 0], [0, 0, 1, 1])).to.equal(true);
    });

    it("should return false for a polygon that doesn't contain a point", () => { // jshint ignore:line
      const point = [0, 0];

      const polygon = [
        -2, 0,
        0, -2,
        2, 0,
        0, 2,
        -2, 0,
        -1, 0,
        0, 1,
        1, 0,
        0, -1,
        -1, 0,
      ];

      expect(geoshapes.overlaps(point, polygon)).to.equal(false);
      expect(geoshapes.overlaps(polygon, point)).to.equal(false);
    }
    );

    it("should return true for a polygon that does contain a point", () => {
      const point = [-1.5, 0];

      const polygon = [
        -2, 0,
        0, -2,
        2, 0,
        0, 2,
        -2, 0,
        -1, 0,
        0, 1,
        1, 0,
        0, -1,
        -1, 0,
      ];

      expect(geoshapes.overlaps(point, polygon)).to.equal(true);
      expect(geoshapes.overlaps(polygon, point)).to.equal(true);
    }
    );

    it("should return false for a polygon that doesn't overlap a box", () => {
      const box = [-0.4, -0.4, 0.4, 0.4];

      const polygon = [
        -2, 0,
        0, -2,
        2, 0,
        0, 2,
        -2, 0,
        -1, 0,
        0, 1,
        1, 0,
        0, -1,
        -1, 0,
      ];

      expect(geoshapes.overlaps(box, polygon)).to.equal(false);
      expect(geoshapes.overlaps(polygon, box)).to.equal(false);
    }
    );

    it("should return true for a polygon that overlaps a box", () => {
      const box = [-0.6, -0.6, 0.6, 0.6];

      const polygon = [
        -2, 0,
        0, -2,
        2, 0,
        0, 2,
        -2, 0,
        -1, 0,
        0, 1,
        1, 0,
        0, -1,
        -1, 0,
      ];

      expect(geoshapes.overlaps(box, polygon)).to.equal(true);
      expect(geoshapes.overlaps(polygon, box)).to.equal(true);
    });

    it("should return false for two polygons that don't overlap", () => {
      expect(
        geoshapes.overlaps(
          [-1, 0, -2, 1, -2, -1],
          [0, 0, -2, -2, 2, -2, 2, 2, -2, 2]
        )
      ).
        to.equal(false);
    }
    );

    it("should return true for two polygons that intersect", () => {
      expect(
        geoshapes.overlaps(
          [ 1, 0, -1, 2, -3, 0, -1, -2],
          [-1, 0, 1, -2, 3, 0, 1, 2]
        )
      ).
        to.equal(true);
    });

    it("should return true for a polygon that contains another", () => {
      const a = [-1, 0, 0, -1, 1, 0, 0, 1];
      const b = [-2, 0, 0, -2, 2, 0, 0, 2];

      expect(geoshapes.overlaps(a, b)).to.equal(true);
      expect(geoshapes.overlaps(b, a)).to.equal(true);
    });
  });

  describe("distance", () => {
    it("should return the distance between Nashville and LA", () => {
      expect(geoshapes.distance(36.12, -86.67, 33.94, -118.4)).
        to.be.closeTo(2892777, 1);
    });

    it("should return the distance between the north + south pole", () => {
      expect(geoshapes.distance(90, 0, -90, 0)).
        to.be.closeTo(20003931, 1);
      expect(geoshapes.distance(0, 0, 0, 180.0)).
        to.be.closeTo(20003931, 1);
    });
  });

  describe("distance_fast", function() {
    it("should be pretty accurate within 100km", () => {
      const e = 0.1; // tenth of a meter

      for(const [lat_1, lon_1, lat_2, lon_2] of [
        [15.677681639125, 0, 15.678222581773295624, 0.005984798364733239],
        [69.421614441160, 0, 69.419698645243129351, 0.011475042329030949],
        [21.321198416367, 0, 21.315727319045969388, 0.000085494785752862],
        [85.803662619041, 0, 85.804119000412898790, 0.003638710597131827],
        [10.997969077787, 0, 10.998635138226394774, 0.001232342388896296],
        [39.055593336126, 0, 39.055987262050561446, 0.010063382646581899],
        [71.323764170696, 0, 71.317104408670415516, 0.021337273019811649],
        [44.164372825833, 0, 44.164685742693261487, 0.000495606731599951],
        [55.405856274821, 0, 55.398896763164340293, 0.012055918541741435],
        [44.394383976882, 0, 44.395472393174073264, 0.004561023456183626],
      ]) {
        expect(geoshapes.distance_fast(lat_1, lon_1, lat_2, lon_2)).
          to.be.closeTo(geoshapes.distance(lat_1, lon_1, lat_2, lon_2), e);
      }
    });
  });

  describe("bearing", function() {
    it("should give a bearing of ~60 degrees from Baghdad to Osaka", () => {
      expect(geoshapes.bearing(35.0, 45.0, 35.0, 135.0)).
        to.be.closeTo(60.0, 1);
    });

    it("should give a bearing of ~300 degrees from Osaka to Baghdad", () => {
      expect(geoshapes.bearing(35.0, 135.0, 35.0, 45.0)).
        to.be.closeTo(300.0, 1);
    });
  });
});
