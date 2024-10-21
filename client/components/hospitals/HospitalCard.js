import Link from 'next/link';
import { MapPin, Phone, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '200px'
};

export default function HospitalCard({ hospital }) {
  const { 
    name, 
    address, 
    phone, 
    operatingHours, 
    availableBeds, 
    totalBeds, 
    status, 
    specialties,
    location 
  } = hospital;

  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const center = location?.coordinates ? {
    lat: location.coordinates[1],
    lng: location.coordinates[0]
  } : {
    lat: -3.745,
    lng: -38.523
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            <Link href={`/hospitals/${hospital._id}`} className="hover:text-blue-600">
              {name}
            </Link>
          </h3>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
          `}>
            {status}
          </span>
        </div>

        <div className="space-y-3">
          {address && (
            <div className="flex items-center text-gray-500">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center text-gray-500">
              <Phone className="w-5 h-5 mr-2" />
              <span>{phone}</span>
            </div>
          )}
          {operatingHours && (
            <div className="flex items-center text-gray-500">
              <Clock className="w-5 h-5 mr-2" />
              <span>{operatingHours}</span>
            </div>
          )}
          {(availableBeds !== undefined && totalBeds !== undefined) && (
            <div className="flex items-center text-gray-500">
              <Users className="w-5 h-5 mr-2" />
              <span>{availableBeds} beds available / {totalBeds} total</span>
            </div>
          )}
        </div>

        {specialties?.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

