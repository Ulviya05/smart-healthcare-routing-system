import React from 'react';
import { Clock, Hospital, User, Phone, AlertCircle, Activity } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-300',
  ARRIVED: 'bg-green-100 text-green-800 border-green-300',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  MODERATE: 'bg-yellow-100 text-yellow-800',
  SEVERE: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

const EmergencyStatus = ({ emergency }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-gray-400" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[emergency.condition]}`}>
              {emergency.condition} Priority
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Reported at {formatDate(emergency.createdAt)}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border ${statusColors[emergency.status]}`}>
          {emergency.status}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Details</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="font-medium text-gray-900">Primary Complaint</p>
              <p className="text-gray-600">{emergency.primaryComplaint}</p>
            </div>
          </div>
          {emergency.vitalSigns && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
              <div>
                <p className="text-sm text-gray-500">Blood Pressure</p>
                <p className="font-medium">{emergency.vitalSigns.bloodPressure}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Heart Rate</p>
                <p className="font-medium">{emergency.vitalSigns.heartRate} bpm</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Temperature</p>
                <p className="font-medium">{emergency.vitalSigns.temperature}°C</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oxygen Saturation</p>
                <p className="font-medium">{emergency.vitalSigns.oxygenSaturation}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {emergency.assignedHospital && (
        <div className="border-t pt-4">
          <div className="flex items-start space-x-3">
            <Hospital className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{emergency.assignedHospital.name}</h3>
              <p className="text-gray-600">{emergency.assignedHospital.address}</p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{emergency.assignedHospital.phone}</span>
                </div>
                {emergency.assignedHospital.erCapacity && (
                  <div className="text-sm">
                    <span className="text-gray-500">ER Capacity: </span>
                    <span className="font-medium">{emergency.assignedHospital.erCapacity}%</span>
                  </div>
                )}
              </div>
              {emergency.assignedHospital.specializations && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {emergency.assignedHospital.specializations.map((spec) => (
                    <span key={spec} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {emergency.ambulanceTeam && (
        <div className="border-t pt-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Ambulance Team</h3>
              <p className="text-gray-600">
                Unit: {emergency.ambulanceTeam.unitNumber}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Paramedic</p>
                  <p className="font-medium">{emergency.ambulanceTeam.paramedic}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium">{emergency.ambulanceTeam.driver}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {emergency.estimatedArrivalTime && (
        <div className="border-t pt-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Estimated Arrival</h3>
              <p className="text-gray-600">{formatDate(emergency.estimatedArrivalTime)}</p>
              {emergency.estimatedDistance && (
                <p className="text-sm text-gray-500 mt-1">
                  Distance: {emergency.estimatedDistance.toFixed(1)} km
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyStatus;
