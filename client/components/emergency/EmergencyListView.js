import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import { getAllEmergencies } from '../../services/emergency';
import LoadingSpinner from '../common/LoadingSpinner';

const statusColors = {
  MODERATE: 'bg-yellow-100 text-yellow-800',
  SEVERE: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const EmergencyListView = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const data = await getAllEmergencies();
        setEmergencies(data);
      } catch (err) {
        setError('Failed to fetch emergency requests');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  if (loading) {
    <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Emergency Requests</h1>
      <button 
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
        onClick={() => router.push('/emergency/request')}
      >
        Report Emergency
      </button>
    </div>

    <div className="grid gap-4">
      {emergencies.map((emergency) => (
        <div
          key={emergency._id}
          onClick={() => router.push(`/emergency/${emergency._id}`)}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[emergency.condition]}`}>
                {emergency.condition}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(emergency.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">{emergency.primaryComplaint}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-sm truncate">{emergency.address}</span>
            </div>
            {emergency.eta && (
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-sm">ETA: {Math.round(emergency.eta / 60)} minutes</span>
              </div>
            )}
          </div>

          {emergency.assignedHospital && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm">
                <span className="font-medium">Assigned Hospital: </span>
                {emergency.assignedHospital.name}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
  );
};

export default EmergencyListView;

