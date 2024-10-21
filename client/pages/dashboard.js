import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import Map from '../components/dashboard/Map';
import HospitalList from '../components/dashboard/HospitalList';
import EmergencyAlert from '../components/dashboard/EmergencyAlert';
import QuickActions from '../components/dashboard/QuickActions';
import { socket } from '../services/socket';
import { getAllEmergencies } from '@/services/emergency';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

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

        const emergenciesData = await getAllEmergencies();
        if (emergenciesData) {
          const activeEmergencies = emergenciesData.filter(
            emergency => getEmergencyStatus(emergency.timestamp) !== 'OUTDATED'
          );
          setEmergencies(activeEmergencies);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.connect();

    const handleHospitalUpdate = (updatedHospital) => {
      setHospitals(prev => prev.map(hospital =>
        hospital.id === updatedHospital.id ? updatedHospital : hospital
      ));
    };

    const handleEmergencyUpdate = (updatedEmergency) => {
      setEmergencies(prev => {
        const exists = prev.some(e => e.id === updatedEmergency.id);
        if (exists) {
          return prev.map(emergency =>
            emergency.id === updatedEmergency.id ? updatedEmergency : emergency
          );
        }
        return [...prev, updatedEmergency];
      });
    };

    const handleCapacityChange = (update) => {
      setHospitals(prev => prev.map(hospital =>
        hospital.id === update.hospitalId
          ? { ...hospital, availableBeds: update.newCapacity }
          : hospital
      ));
    };

    socket.on('hospital-update', handleHospitalUpdate);
    socket.on('emergency-update', handleEmergencyUpdate);
    socket.on('new-emergency', handleEmergencyUpdate);
    socket.on('hospital-capacity-change', handleCapacityChange);

    return () => {
      socket.off('hospital-update', handleHospitalUpdate);
      socket.off('emergency-update', handleEmergencyUpdate);
      socket.off('new-emergency', handleEmergencyUpdate);
      socket.off('hospital-capacity-change', handleCapacityChange);
      socket.disconnect();
    };
  }, [user, router]);

  const handleEmergencySubmit = async (emergencyData) => {
    try {
      const response = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyData),
      });

      if (!response.ok) throw new Error('Failed to create emergency');

      const newEmergency = await response.json();
      setEmergencies(prev => [...prev, newEmergency]);
    } catch (error) {
      console.error('Error creating emergency:', error);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="sticky top-0 z-10">
          <EmergencyAlert 
            emergencies={emergencies.filter(e => e.condition === 'CRITICAL')} 
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <QuickActions 
              onEmergencySubmit={handleEmergencySubmit}
              selectedHospital={selectedHospital}
              hospitals={hospitals}
            />
            
            <Map 
              hospitals={hospitals}
              emergencies={emergencies}
              selectedHospital={selectedHospital}
              selectedEmergency={selectedEmergency}
              onHospitalSelect={setSelectedHospital}
              onEmergencySelect={setSelectedEmergency}
            />
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <HospitalList 
              hospitals={hospitals}
              selectedHospital={selectedHospital}
              onHospitalSelect={setSelectedHospital}
              emergencies={emergencies}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}