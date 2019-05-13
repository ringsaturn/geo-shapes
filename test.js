/* eslint-disable no-multi-spaces */
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
    describe("approximate", () => {
      it("should be pretty accurate within 475km", () => {
        // examples from https://doi.org/10.5281/zenodo.32156
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
          [16.818162143383, 0, 16.809984781359843064, 0.001439070731248210],
          [69.003992855280, 0, 69.006763256368733606, 0.026357933367896387],
          [ 5.547117631775, 0,  5.546195116921527989, 0.006895731534295820],
          [50.226334343196, 0, 50.219623789596831242, 0.005013436541025229],
          [57.393557467659, 0, 57.392634283310877945, 0.005546529430214963],
          [71.437636726477, 0, 71.432905877878804164, 0.006265561543085281],
          [30.958150481394, 0, 30.964581957015780044, 0.006999020088176955],
          [58.958518633820, 0, 58.967413748887092596, 0.000660697269814137],
          [28.989678684325, 0, 28.991224929378981275, 0.008612362481038731],
          [74.666869463648, 0, 74.666394354167375201, 0.000947320291618308],
          [ 0.661005606982, 0,  0.661986874839681714, 0.000135500136258080],
          [31.287574192035, 0, 31.289466845218994764, 0.001442277150631539],
          [25.795145739083, 0, 25.801092035143849091, 0.000254305403191031],
          [48.779636809712, 0, 48.781415674910752100, 0.008751227514655718],
          [ 0.158162537679, 0,  0.158927560026337666, 0.000009631322084302],
          [ 9.289022816816, 0,  9.289507277180388622, 0.001651287363939816],
          [ 8.102233712701, 0,  8.107420997434430417, 0.003348508998460040],
          [ 8.022892797192, 0,  8.016759754063362691, 0.001534090713999802],
          [ 0.423713386006, 0,  0.426439456900091833, 0.000128589054904859],
          [48.515742534113, 0, 48.517901638154699816, 0.010638419246199495],
          [12.882714384074, 0, 12.882531989738235527, 0.000316413588662890],
          [26.613097918155, 0, 26.616062442265568510, 0.001353354570999358],
          [28.373439998096, 0, 28.373464569511830518, 0.000201081412414396],
          [65.547759925425, 0, 65.548187648296896430, 0.002855012930951945],
          [ 3.318902828561, 0,  3.319265228238796491, 0.000122690297526340],
          [ 6.647000578175, 0,  6.648732327978324750, 0.000284035364766512],
          [49.197629844481, 0, 49.201746749154919705, 0.013788162988555876],
          [26.690233011764, 0, 26.690035981947257878, 0.000658925959670638],
          [68.064882660011, 0, 68.068001994121156088, 0.001522215593927408],
          [15.289072441374, 0, 15.283889074979240935, 0.004266732606462716],
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
