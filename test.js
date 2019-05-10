"use strict";
const expect = require("chai").expect;
const geo_shapes = require("./index");

describe("geo-shapes", () => {
  describe("geometry", () => {
    describe("overlaps", () => {
      it("should return false for two points that don't match", () => {
        expect(geo_shapes.geometry.overlaps([0, 1], [1, 0])).to.equal(false);
      });

      it("should return true for two points that match", () => {
        expect(geo_shapes.geometry.overlaps([0, 1], [0, 1])).to.equal(true);
      });


      it("should return false for a point outside of a box", () => {
        expect(geo_shapes.geometry.overlaps([-1, -1, +1, +1], [2, 0])).to.equal(false);
        expect(geo_shapes.geometry.overlaps([2, 0], [-1, -1, +1, +1])).to.equal(false);
      });

      it("should return true for a point inside of a box", () => {
        expect(geo_shapes.geometry.overlaps([-1, -1, +1, +1], [0, 0])).to.equal(true);
        expect(geo_shapes.geometry.overlaps([0, 0], [-1, -1, +1, +1])).to.equal(true);
      });

      it("should return false for two boxes that don't overlap", () => {
        expect(geo_shapes.geometry.overlaps([-2, -2, -1, -1], [1, 1, 2, 2])).
          to.equal(false);
      });

      it("should return true for two boxes that overlap", () => {
        expect(geo_shapes.geometry.overlaps([-1, -1, 0, 0], [0, 0, 1, 1])).to.equal(true);
      });

      it("should return false for a polygon that doesn't contain a point", () => {
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

        expect(geo_shapes.geometry.overlaps(point, polygon)).to.equal(false);
        expect(geo_shapes.geometry.overlaps(polygon, point)).to.equal(false);
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

        expect(geo_shapes.geometry.overlaps(point, polygon)).to.equal(true);
        expect(geo_shapes.geometry.overlaps(polygon, point)).to.equal(true);
      });

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

        expect(geo_shapes.geometry.overlaps(box, polygon)).to.equal(false);
        expect(geo_shapes.geometry.overlaps(polygon, box)).to.equal(false);
      });

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

        expect(geo_shapes.geometry.overlaps(box, polygon)).to.equal(true);
        expect(geo_shapes.geometry.overlaps(polygon, box)).to.equal(true);
      });

      it("should return false for two polygons that don't overlap", () => {
        expect(
          geo_shapes.geometry.overlaps(
            [-1, 0, -2, 1, -2, -1],
            [0, 0, -2, -2, 2, -2, 2, 2, -2, 2]
          )
        ).
          to.equal(false);
      });

      it("should return true for two polygons that intersect", () => {
        expect(
          geo_shapes.geometry.overlaps(
            [ 1, 0, -1, 2, -3, 0, -1, -2],
            [-1, 0, 1, -2, 3, 0, 1, 2]
          )
        ).
          to.equal(true);
      });

      it("should return true for a polygon that contains another", () => {
        const a = [-1, 0, 0, -1, 1, 0, 0, 1];
        const b = [-2, 0, 0, -2, 2, 0, 0, 2];

        expect(geo_shapes.geometry.overlaps(a, b)).to.equal(true);
        expect(geo_shapes.geometry.overlaps(b, a)).to.equal(true);
      });
    });
  });

  describe("geodesy", () => {
    // examples from https://doi.org/10.5281/zenodo.32156
    describe("approximate", () => {
      it("should be pretty accurate within 100km", () => {
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
          const approximate = geo_shapes.geodesy.approximate(lat_1, lon_1, lat_2, lon_2);
          const exact = geo_shapes.geodesy.exact(lat_1, lon_1, lat_2, lon_2);

          expect(approximate.distance).to.be.closeTo(exact.distance, 0.1);
          expect(approximate.azimuth).to.be.closeTo(exact.azimuth, 0.1);
        }
      });
    });

    describe("exact", () => {
      it("should return the distance between Nashville and LA", () => {
        expect(geo_shapes.geodesy.exact(36.12, -86.67, 33.94, -118.4, geo_shapes.geodesy.DISTANCE)).
          to.be.closeTo(2892777, 1);
      });

      it("should return the distance between the north + south pole", () => {
        expect(geo_shapes.geodesy.exact(90, 0, -90, 0, geo_shapes.geodesy.DISTANCE)).to.be.closeTo(20003931, 1);
        expect(geo_shapes.geodesy.exact(0, 0, 0, 180, geo_shapes.geodesy.DISTANCE)).to.be.closeTo(20003931, 1);
      });

      it("should give a bearing of ~60 degrees from Baghdad to Osaka", () => {
        expect(geo_shapes.geodesy.exact(35, 45, 35, 135, geo_shapes.geodesy.AZIMUTH)).to.be.closeTo(60, 1);
      });

      it("should give a geodesy.exact of ~300 degrees from Osaka to Baghdad", () => {
        expect(geo_shapes.geodesy.exact(35, 135, 35, 45, geo_shapes.geodesy.AZIMUTH)).to.be.closeTo(300, 1);
      });
    });
  });
});
