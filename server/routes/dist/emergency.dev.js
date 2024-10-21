"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require('express');

var router = express.Router();

var Emergency = require('../models/Emergency');

var Hospital = require('../models/Hospital');

var _require = require('../utils/distance'),
    calculateDistance = _require.calculateDistance;

var auth = require('../middleware/auth');

var _require2 = require('../socketServer'),
    emitNewEmergency = _require2.emitNewEmergency,
    emitEmergencyUpdate = _require2.emitEmergencyUpdate;

var _require3 = require('mongoose'),
    mongoose = _require3["default"];

router.post('/', auth, function _callee(req, res) {
  var session, _req$body, condition, primaryComplaint, additionalDetails, _req$body$specialties, specialties, location, address, requiresICU, requiresOR, hospital, distanceData, emergency;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(mongoose.startSession());

        case 2:
          session = _context.sent;
          session.startTransaction();
          _context.prev = 4;
          _req$body = req.body, condition = _req$body.condition, primaryComplaint = _req$body.primaryComplaint, additionalDetails = _req$body.additionalDetails, _req$body$specialties = _req$body.specialties, specialties = _req$body$specialties === void 0 ? [] : _req$body$specialties, location = _req$body.location, address = _req$body.address, requiresICU = _req$body.requiresICU, requiresOR = _req$body.requiresOR;
          _context.next = 8;
          return regeneratorRuntime.awrap(Hospital.findOneAndUpdate(_objectSpread({
            status: {
              $ne: 'Full'
            },
            availableBeds: {
              $gt: 0
            }
          }, requiresICU ? {
            availableICU: {
              $gt: 0
            }
          } : {}, {}, requiresOR ? {
            availableOR: {
              $gt: 0
            }
          } : {}, {
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [location.lng, location.lat]
                },
                $maxDistance: 50000
              }
            }
          }), {
            $inc: _objectSpread({
              availableBeds: -1
            }, requiresICU ? {
              availableICU: -1
            } : {}, {}, requiresOR ? {
              availableOR: -1
            } : {})
          }, {
            "new": true,
            session: session,
            sort: {
              location: 1,
              specialties: specialties.length > 0 ? 1 : -1
            }
          }));

        case 8:
          hospital = _context.sent;

          if (hospital) {
            _context.next = 13;
            break;
          }

          _context.next = 12;
          return regeneratorRuntime.awrap(session.abortTransaction());

        case 12:
          return _context.abrupt("return", res.status(404).json({
            message: 'No available hospitals found'
          }));

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(calculateDistance({
            lat: location.lat,
            lng: location.lng
          }, {
            lat: hospital.location.coordinates[1],
            lng: hospital.location.coordinates[0]
          }));

        case 15:
          distanceData = _context.sent;
          emergency = new Emergency({
            condition: condition,
            primaryComplaint: primaryComplaint,
            additionalDetails: additionalDetails,
            specialties: specialties,
            location: {
              type: 'Point',
              coordinates: [location.lng, location.lat]
            },
            address: address,
            requiresICU: requiresICU,
            requiresOR: requiresOR,
            assignedHospital: hospital._id,
            eta: distanceData.duration,
            distanceToHospital: distanceData.distance,
            createdAt: new Date()
          });
          _context.next = 19;
          return regeneratorRuntime.awrap(emergency.save({
            session: session
          }));

        case 19:
          _context.next = 21;
          return regeneratorRuntime.awrap(emergency.populate('assignedHospital'));

        case 21:
          _context.next = 23;
          return regeneratorRuntime.awrap(session.commitTransaction());

        case 23:
          _context.next = 25;
          return regeneratorRuntime.awrap(emitNewEmergency(emergency));

        case 25:
          res.status(201).json({
            emergency: emergency,
            hospital: hospital,
            eta: emergency.eta,
            distance: emergency.distanceToHospital
          });
          _context.next = 34;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](4);
          _context.next = 32;
          return regeneratorRuntime.awrap(session.abortTransaction());

        case 32:
          console.error('Emergency creation error:', _context.t0);
          res.status(500).json({
            message: 'Error creating emergency request'
          });

        case 34:
          _context.prev = 34;
          session.endSession();
          return _context.finish(34);

        case 37:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[4, 28, 34, 37]]);
});
router.get('/:id', auth, function _callee2(req, res) {
  var emergency;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(Emergency.findById(req.params.id).populate('assignedHospital'));

        case 3:
          emergency = _context2.sent;

          if (emergency) {
            _context2.next = 6;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            message: 'Emergency request not found'
          }));

        case 6:
          res.json(emergency);
          _context2.next = 13;
          break;

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          console.error('Error fetching emergency:', _context2.t0);
          res.status(500).json({
            message: 'Error fetching emergency details'
          });

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
router.get('/', auth, function _callee3(req, res) {
  var emergencies;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(Emergency.find().populate('assignedHospital').sort({
            createdAt: -1
          }));

        case 3:
          emergencies = _context3.sent;
          res.json(emergencies);
          _context3.next = 11;
          break;

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.error('Error fetching emergencies:', _context3.t0);
          res.status(500).json({
            message: 'Error fetching emergency requests'
          });

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
router.patch('/:id', auth, function _callee4(req, res) {
  var emergency;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(Emergency.findByIdAndUpdate(req.params.id, {
            $set: req.body
          }, {
            "new": true
          }).populate('assignedHospital'));

        case 3:
          emergency = _context4.sent;

          if (emergency) {
            _context4.next = 6;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            message: 'Emergency request not found'
          }));

        case 6:
          _context4.next = 8;
          return regeneratorRuntime.awrap(emitEmergencyUpdate(emergency._id));

        case 8:
          res.json(emergency);
          _context4.next = 15;
          break;

        case 11:
          _context4.prev = 11;
          _context4.t0 = _context4["catch"](0);
          console.error('Error updating emergency:', _context4.t0);
          res.status(500).json({
            message: 'Error updating emergency details'
          });

        case 15:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
module.exports = router;