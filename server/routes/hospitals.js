const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');
const { emitHospitalUpdate, emitNewHospital } = require('../socketServer');

router.post('/', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2 ||
        isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return res.status(400).json({ message: 'Invalid location coordinates. Latitude and longitude must be valid numbers.' });
    }
    
    const hospital = new Hospital(req.body);
    await hospital.save();
    await emitNewHospital(hospital);
    res.status(201).json(hospital);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    
    await emitHospitalUpdate(hospital);
    
    res.json(hospital);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;