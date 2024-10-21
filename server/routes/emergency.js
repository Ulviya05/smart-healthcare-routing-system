const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const { calculateDistance } = require('../utils/distance');
const auth = require('../middleware/auth');
const { emitNewEmergency, emitEmergencyUpdate } = require('../socketServer');
const { default: mongoose } = require('mongoose');

router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      condition,
      primaryComplaint,
      additionalDetails,
      specialties = [],
      location,
      address,
      requiresICU,
      requiresOR
    } = req.body;

    const hospital = await Hospital.findOneAndUpdate(
      {
        status: { $ne: 'Full' },
        availableBeds: { $gt: 0 },
        ...(requiresICU ? { availableICU: { $gt: 0 } } : {}),
        ...(requiresOR ? { availableOR: { $gt: 0 } } : {}),
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.lng, location.lat]
            },
            $maxDistance: 50000
          }
        }
      },
      {
        $inc: {
          availableBeds: -1,
          ...(requiresICU ? { availableICU: -1 } : {}),
          ...(requiresOR ? { availableOR: -1 } : {})
        }
      },
      {
        new: true, 
        session, 
        sort: { 
          location: 1,
          specialties: specialties.length > 0 ? 1 : -1
        }
      }
    );

    if (!hospital) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'No available hospitals found' });
    }

    const distanceData = await calculateDistance(
      { lat: location.lat, lng: location.lng },
      { lat: hospital.location.coordinates[1], lng: hospital.location.coordinates[0] }
    );

    const emergency = new Emergency({
      condition,
      primaryComplaint,
      additionalDetails,
      specialties,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      address,
      requiresICU,
      requiresOR,
      assignedHospital: hospital._id,
      eta: distanceData.duration,
      distanceToHospital: distanceData.distance,
      createdAt: new Date()
    });

    await emergency.save({ session });
    await emergency.populate('assignedHospital');
    

    await session.commitTransaction();
    
    await emitNewEmergency(emergency);

    res.status(201).json({
      emergency,
      hospital,
      eta: emergency.eta,
      distance: emergency.distanceToHospital
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Emergency creation error:', error);
    res.status(500).json({ message: 'Error creating emergency request' });
  } finally {
    session.endSession();
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('assignedHospital');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    res.status(500).json({ message: 'Error fetching emergency details' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const emergencies = await Emergency.find()
      .populate('assignedHospital')
      .sort({ createdAt: -1 }); 

    res.json(emergencies);
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({ message: 'Error fetching emergency requests' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('assignedHospital');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    await emitEmergencyUpdate(emergency._id);

    res.json(emergency);
  } catch (error) {
    console.error('Error updating emergency:', error);
    res.status(500).json({ message: 'Error updating emergency details' });
  }
});


module.exports = router;