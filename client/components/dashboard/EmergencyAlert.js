import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { socket } from '@/services/socket';
import { getAllEmergencies } from '../../services/emergency';

const EMERGENCY_TIMEFRAME = 1 * 60 * 60 * 1000; 
const RECENT_THRESHOLD = 30 * 60 * 1000; 

export default function EmergencyAlert() {
  const [emergencies, setEmergencies] = useState([]);
  const [displayedEmergency, setDisplayedEmergency] = useState(null);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const data = await getAllEmergencies();
        if (data && data.length > 0) {
          updateEmergencies(data);
        }
      } catch (err) {
        console.error('Failed to fetch emergency requests');
      }
    };

    const updateEmergencies = (emergencyList) => {
      const now = new Date().getTime();
      const validEmergencies = emergencyList.filter(emergency => {
        const emergencyTime = new Date(emergency.createdAt).getTime();
        return (now - emergencyTime) <= EMERGENCY_TIMEFRAME;
      });

      setEmergencies(validEmergencies);
      
      const criticalEmergencies = validEmergencies.filter(e => e.condition === 'CRITICAL');
      const recentEmergencies = validEmergencies.filter(e => 
        (now - new Date(e.createdAt).getTime()) <= RECENT_THRESHOLD
      );

      if (criticalEmergencies.length > 0 && recentEmergencies.some(e => e.condition === 'CRITICAL')) {
        setDisplayedEmergency(criticalEmergencies.find(e => 
          (now - new Date(e.createdAt).getTime()) <= RECENT_THRESHOLD
        ));
      } else if (criticalEmergencies.length > 0) {
        setDisplayedEmergency(criticalEmergencies[0]);
      } else if (recentEmergencies.length > 0) {
        setDisplayedEmergency(recentEmergencies[0]);
      } else if (validEmergencies.length > 0) {
        setDisplayedEmergency(validEmergencies[0]);
      } else {
        setDisplayedEmergency(null);
      }
    };

    fetchEmergencies();
    const intervalId = setInterval(fetchEmergencies, 60000); 

    socket.connect();

    socket.on('new-emergency', (emergencyData) => {
      setEmergencies(prev => {
        const updated = [emergencyData, ...prev];
        updateEmergencies(updated);
        return updated;
      });
    });

    socket.on('emergency-update', (updatedEmergency) => {
      setEmergencies(prev => {
        const updated = prev.map(emergency => 
          emergency._id === updatedEmergency._id ? updatedEmergency : emergency
        );
        updateEmergencies(updated);
        return updated;
      });
    });

    return () => {
      clearInterval(intervalId);
      socket.off('new-emergency');
      socket.off('emergency-update');
      socket.disconnect();
    };
  }, []);

  const getSeverityStyles = (condition) => {
    switch (condition) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'SEVERE':
        return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'MODERATE':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default:
        return 'bg-emerald-50 border-emerald-300 text-emerald-700';
    }
  };

  const getIconColor = (condition) => {
    switch (condition) {
      case 'CRITICAL':
        return 'text-red-500';
      case 'SEVERE':
        return 'text-orange-500';
      case 'MODERATE':
        return 'text-yellow-600';
      default:
        return 'text-emerald-500';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      age: Math.floor((new Date() - date) / 60000) 
    };
  };

  const getEmergencyStatus = (timestamp) => {
    const age = new Date() - new Date(timestamp);
    if (age <= RECENT_THRESHOLD) return 'NEW';
    if (age <= EMERGENCY_TIMEFRAME) return 'ACTIVE';
    return 'OUTDATED';
  };

  const EmergencyContent = ({ emergency }) => {
    const { time, age } = formatTime(emergency.createdAt);
    const status = getEmergencyStatus(emergency.createdAt);

    return (
      <div className="flex items-start">
        <AlertTriangle className={`w-8 h-8 mr-4 ${getIconColor(emergency.condition)}`} />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Emergency Alert</h3>
              {status === 'NEW' && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium opacity-75">
                {time} ({age} mins ago)
              </span>
            </div>
          </div>

          <p className="font-semibold mb-1">
            Location: <span className="font-normal">{emergency.address}</span>
          </p>
          <p className="font-semibold mb-1">
            Condition: <span className="font-normal">{emergency.condition}</span>
          </p>

          <div className="flex gap-2 text-sm mt-2">
            {emergency.requiresICU && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                ICU Required
              </span>
            )}
            {emergency.requiresOR && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                OR Required
              </span>
            )}
          </div>

          {emergency.assignedHospital && (
            <p className="text-sm font-semibold mt-2">
              Assigned Hospital: <span className="font-normal">{emergency.assignedHospital.name}</span>
              {emergency.eta && ` (ETA: ${emergency.eta} mins)`}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`border-l-4 p-4 rounded-md shadow-lg transition-all ${
        displayedEmergency 
          ? getSeverityStyles(displayedEmergency.condition)
          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
      }`}
    >
      {displayedEmergency ? (
        <EmergencyContent emergency={displayedEmergency} />
      ) : (
        <div className="flex items-center justify-center py-4">
          <AlertTriangle className="w-6 h-6 text-emerald-500 mr-2" />
          <span className="text-emerald-700">No active emergencies</span>
        </div>
      )}
    </div>
  );
}
