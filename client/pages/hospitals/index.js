import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HospitalCard from '../../components/hospitals/HospitalCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GoogleMapsWrapper from '../../components/wrappers/GoogleMapsWrapper';
import Link from 'next/link';
import axios from 'axios'; 

export default function Hospitals() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); 
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hospitals`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      setHospitals(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  if (loading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
          <Link
            href="/hospitals/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Hospital
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        )}

        <GoogleMapsWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <Link key={hospital._id} href={`/hospitals/${hospital._id}`}>
                <HospitalCard hospital={hospital} />
              </Link>
            ))}
          </div>
        </GoogleMapsWrapper>
      </div>
    </DashboardLayout>
  );
}
