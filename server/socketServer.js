const socketIo = require('socket.io');
const Emergency = require('./models/Emergency');
const Hospital = require('./models/Hospital');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

const emitNewEmergency = async (emergency) => {
  try {
    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate('assignedHospital')
      .lean();

    if (!populatedEmergency) {
      console.error('Emergency not found:', emergency._id);
      return;
    }

    io.emit('new-emergency', populatedEmergency);
  } catch (error) {
    console.error('Error emitting new emergency:', error);
  }
};

const emitEmergencyUpdate = async (emergencyId) => {
  try {
    const emergency = await Emergency.findById(emergencyId)
      .populate('assignedHospital')
      .lean();

    if (!emergency) {
      console.error('Emergency not found:', emergencyId);
      return;
    }

    io.emit('emergency-update', emergency);
  } catch (error) {
    console.error('Error emitting emergency update:', error);
  }
};

const emitNewHospital = async (hospital) => {
  try {
    const populatedHospital = await Hospital.findById(hospital._id).lean();

    if (!populatedHospital) {
      console.error('Hospital not found:', hospital._id);
      return;
    }

    io.emit('new-hospital-added', populatedHospital);
  } catch (error) {
    console.error('Error emitting new hospital:', error);
  }
};

const emitHospitalUpdate = async (hospitalId) => {
  try {
    const hospital = await Hospital.findById(hospitalId).lean();

    if (!hospital) {
      console.error('Hospital not found:', hospitalId);
      return;
    }

    io.emit('hospital-capacity-update', hospital);
  } catch (error) {
    console.error('Error emitting hospital update:', error);
  }
};

const emitHospitalStatusChange = async (hospitalId, status) => {
  try {
    const hospital = await Hospital.findById(hospitalId).lean();

    if (!hospital) {
      console.error('Hospital not found:', hospitalId);
      return;
    }

    io.emit('hospital-status-change', {
      hospitalId,
      status,
      hospital
    });
  } catch (error) {
    console.error('Error emitting hospital status change:', error);
  }
};

module.exports = {
  initializeSocket,
  emitNewEmergency,
  emitEmergencyUpdate,
  emitNewHospital,
  emitHospitalUpdate,
  emitHospitalStatusChange
};