import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import EmergencyRequestForm from '../../components/emergency/EmergencyRequestForm';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';

const EmergencyPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Emergency Assistance
        </h1>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-8">
          <p className="text-red-700">
            For life-threatening emergencies, always call emergency services (911) first.
          </p>
        </div>
        <EmergencyRequestForm />
      </div>
    </DashboardLayout>
  );
};

export default EmergencyPage;