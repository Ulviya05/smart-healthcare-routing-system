const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  operatingHours: { type: String, required: true },
  totalBeds: { type: Number, required: true, min: 0 },
  availableBeds: { type: Number, required: true, min: 0 },
  specialties: [{ type: String, trim: true }],
  status: { type: String, enum: ['Available', 'Busy', 'Full'], default: 'Available' },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  totalICU: { type: Number, default: 0 },
  availableICU: { type: Number, default: 0 },
  totalOR: { type: Number, default: 0 },
  availableOR: { type: Number, default: 0 },
  activeRoutes: { type: Array, default: [] }
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
