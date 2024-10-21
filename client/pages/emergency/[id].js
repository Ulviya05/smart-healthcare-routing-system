import { useRouter } from 'next/router';
import EmergencyStatus from '../../components/emergency/EmergencyStatus';
import EmergencyMap from '../../components/emergency/EmergencyMap';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { getEmergencyStatus } from '../../services/emergency'
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function EmergencyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchEmergency = async () => {
      try {
        const data = await getEmergencyStatus(id); 
        setEmergency(data);
      } catch (err) {
        setError('Failed to fetch emergency details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergency();
  }, [id]);

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

  if (!emergency) return null;

  return (
    <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
        <button
            onClick={() => router.push('/emergency')}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Emergency List
        </button>
        
        <div className="grid gap-6 md:grid-cols-2">
            <EmergencyStatus emergency={emergency} />
            <EmergencyMap
            emergency={emergency}
            patientLocation={emergency.location.coordinates}
            hospitalLocation={emergency.assignedHospital?.location?.coordinates}
            />
        </div>
        </div>
    </DashboardLayout>
  );
}
