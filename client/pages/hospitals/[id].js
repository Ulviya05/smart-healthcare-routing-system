import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HospitalDetails from '../../components/hospitals/HospitalDetails'; 
import HospitalForm from '../../components/hospitals/HospitalForm';
import GoogleMapsWrapper from '../../components/wrappers/GoogleMapsWrapper'; 

export default function HospitalDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [hospital, setHospital] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHospitalDetails();
    }
  }, [id]);

  const fetchHospitalDetails = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/${id}`);
      setHospital(response.data);
    } catch (error) {
      toast.error('Failed to fetch hospital details');
    }
  };

  const handleUpdate = async (updatedHospital) => {
    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/${id}`, updatedHospital, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      setHospital(response.data);
      setIsEditing(false);
      toast.success('Hospital updated successfully');
    } catch (error) {
      toast.error('Failed to update hospital');
    }
  };

  if (!hospital) return <div>Loading...</div>;

  return (
    <DashboardLayout>
        <GoogleMapsWrapper> 
            <div className="container mx-auto px-4 py-8">
                {isEditing ? (
                <HospitalForm hospital={hospital} onSubmit={handleUpdate} />
                ) : (
                <HospitalDetails hospital={hospital} /> 
                )}
                {!isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Edit Hospital
                </button>
                )}
            </div>
      </GoogleMapsWrapper> 
    </DashboardLayout>
  );
}

