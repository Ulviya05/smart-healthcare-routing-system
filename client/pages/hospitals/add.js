import React from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HospitalForm from '../../components/hospitals/HospitalForm';

export default function AddHospital() {
  const router = useRouter();

  const handleSubmit = (newHospital) => {
    router.push('/hospitals');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Add New Hospital</h1>
        <HospitalForm onSubmit={handleSubmit} />
      </div>
    </DashboardLayout>
  );
}