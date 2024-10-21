import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { createEmergencyRequest } from '../../services/emergency';
import { toast } from 'react-toastify';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

const libraries = ['places'];

const CONDITIONS = ['MODERATE', 'SEVERE', 'CRITICAL'];
const COMMON_SPECIALTIES = [
  'Emergency Medicine',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Surgery'
];

const BAKU_COORDINATES = { lat: 40.3893, lng: 49.8474 };

const PlacesAutocomplete = ({ setSelected }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => BAKU_COORDINATES.lat, lng: () => BAKU_COORDINATES.lng },
      radius: 200 * 1000, 
    },
  });

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setSelected({
        location: { lat, lng },
        address: results[0].formatted_address
      });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <Combobox onSelect={handleSelect}>
      <ComboboxInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        placeholder="Enter incident location"
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};

const EmergencyRequestForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    condition: 'MODERATE',
    primaryComplaint: '',
    additionalDetails: '',
    specialties: [],
    requiresICU: false,
    requiresOR: false,
    patientAge: '',
    patientGender: '',
    isConscious: true,
    isBreathing: true,
    estimatedArrivalTime: null
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setError('Please enter and confirm the incident location');
      return;
    }

    if (!formData.primaryComplaint) {
      setError('Please enter primary complaint');
      return;
    }

    setLoading(true);
    try {
      const emergencyData = {
        ...formData,
        location: selected.location,
        address: selected.address,
        dispatcherId: user.id,
        timestamp: new Date().toISOString()
      };

      const response = await createEmergencyRequest(emergencyData);
      toast.success('Emergency request created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      window.location.href = `/emergency/${response.emergency._id}`;
    } catch (error) {
      setError('Failed to create emergency request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Emergency Request</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Location*
            </label>
            <PlacesAutocomplete setSelected={setSelected} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Severity*
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Age
              </label>
              <input
                type="number"
                value={formData.patientAge}
                onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Age"
                min="0"
                max="120"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Complaint*
            </label>
            <input
              type="text"
              value={formData.primaryComplaint}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                primaryComplaint: e.target.value 
              }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="e.g., Chest Pain, Difficulty Breathing, Major Trauma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details
            </label>
            <textarea
              value={formData.additionalDetails}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                additionalDetails: e.target.value 
              }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Any additional relevant information"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Specialties
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_SPECIALTIES.map(specialty => (
                <label key={specialty} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          specialties: [...prev.specialties, specialty]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          specialties: prev.specialties.filter(s => s !== specialty)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isConscious}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isConscious: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Conscious</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isBreathing}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isBreathing: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Breathing</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility Requirements
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresICU}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requiresICU: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">ICU</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresOR}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requiresOR: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Operating Room</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Submit Emergency Request'}
          </button>
        </form>
      </div>

      <div className="h-96 lg:h-auto bg-gray-100 rounded-lg shadow overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={selected?.location || BAKU_COORDINATES}
          zoom={14}
        >
          {selected?.location && (
            <Marker
              position={selected.location}
              label="Incident Location"
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default EmergencyRequestForm;
