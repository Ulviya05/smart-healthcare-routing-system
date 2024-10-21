const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  condition: {
    type: String,
    enum: ['MODERATE', 'SEVERE', 'CRITICAL'],
    required: true
  },
  primaryComplaint: {
    type: String,
    required: true,
    trim: true
  },
  additionalDetails: {
    type: String,
    trim: true
  },
  specialties: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  requiresICU: {
    type: Boolean,
    default: false
  },
  requiresOR: {
    type: Boolean,
    default: false
  },
  assignedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  eta: Number,
  distanceToHospital: Number
}, {
  timestamps: true
});

emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);