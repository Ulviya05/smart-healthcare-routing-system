import { useState, useEffect } from 'react';
import { 
  Ambulance, 
  AlertTriangle, 
  Hospital, 
  BedDouble,
  ClipboardList
} from 'lucide-react';
import { useRouter } from 'next/router';

export default function QuickActions({ selectedHospital }) {
  const router = useRouter();
  const [hospitals, setHospitals] = useState([]);
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEmergencyStatus = (timestamp) => {
    const emergencyTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - emergencyTime) / (1000 * 60 * 60);
    return hoursDiff < 24 ? 'ACTIVE' : 'OUTDATED';
  };

  const fetchData = async () => {
    try {
      const hospitalsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hospitals`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      if (hospitalsResponse.ok) {
        const hospitalsData = await hospitalsResponse.json();
        setHospitals(hospitalsData);
      }

      const emergenciesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emergencies`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      if (emergenciesResponse.ok) {
        const emergenciesData = await emergenciesResponse.json();
        const activeEmergencies = emergenciesData.filter(
          emergency => getEmergencyStatus(emergency.createdAt) === 'ACTIVE'
        );
        setEmergencies(activeEmergencies);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const availableHospitalsCount = hospitals.filter(h => 
    (h.status === 'Available' || h.status === 'Busy') && h.availableBeds > 0
  ).length;
  
  const activeEmergenciesCount = emergencies.filter(e => 
    e.assignedHospital && getEmergencyStatus(e.createdAt) === 'ACTIVE'
  ).length;

  const calculateBedUtilization = () => {
    const totalBeds = hospitals.reduce((acc, hospital) => acc + hospital.totalBeds, 0);
    const occupiedBeds = hospitals.reduce((acc, hospital) => 
      acc + (hospital.totalBeds - hospital.availableBeds), 0
    );
    
    return totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  };

  const handleReportEmergency = () => {
    router.push('/emergency/request');
  };

  const getBedUtilizationColor = (percentage) => {
    if (percentage < 50) return 'green';
    if (percentage < 75) return 'yellow';
    return 'red';
  };
  
  const bedUtilization = calculateBedUtilization();
  const utilizationColor = getBedUtilizationColor(bedUtilization);
  
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      bar: 'bg-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      bar: 'bg-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      bar: 'bg-red-600'
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Emergency Dashboard</h2>
        <button
          onClick={handleReportEmergency}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          <AlertTriangle className="inline-block mr-2" />
          Report Emergency
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="flex items-center">
            <Hospital className="text-blue-600 w-5 h-5 mr-2" />
            <h3 className="font-semibold">Available Hospitals</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{availableHospitalsCount}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <div className="flex items-center">
            <Ambulance className="text-yellow-600 w-5 h-5 mr-2" />
            <h3 className="font-semibold">Active Emergencies</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{activeEmergenciesCount}</p>
        </div>

        <div className={`${colorClasses[utilizationColor].bg} p-4 rounded`}>
  <div className="flex items-center">
    <BedDouble className={`${colorClasses[utilizationColor].text} w-5 h-5 mr-2`} />
    <h3 className="font-semibold">Bed Utilization</h3>
  </div>
  <div className="mt-2">
    <p className="text-2xl font-bold">{bedUtilization}%</p>
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div 
        className={`${colorClasses[utilizationColor].bar} h-2.5 rounded-full`}
        style={{ width: `${bedUtilization}%` }}
      ></div>
    </div>
  </div>
</div>
      </div>

      {selectedHospital && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Hospital Status
          </h3>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-bold">{selectedHospital.name}</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p>Total Beds: {selectedHospital.totalBeds}</p>
              <p>Available Beds: {selectedHospital.availableBeds}</p>
              <p>Status: {selectedHospital.status}</p>
              <p>Specialties: {selectedHospital.specialties.join(', ')}</p>
              <p>ICU Beds Available: {selectedHospital.availableICU} / {selectedHospital.totalICU}</p>
              <p>Operating Rooms Available: {selectedHospital.availableOR} / {selectedHospital.totalOR}</p>
              <p>Operating Hours: {selectedHospital.operatingHours}</p>
              <p>Contact: {selectedHospital.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}