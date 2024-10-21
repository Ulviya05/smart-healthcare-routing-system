import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
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

export default function HospitalForm({ hospital, onSubmit, onCancel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    operatingHours: '',
    totalBeds: 0,
    availableBeds: 0,
    specialties: '',
    status: 'Available',
    latitude: '',
    longitude: '',
    totalICU: 0,
    availableICU: 0,
    totalOR: 0,
    availableOR: 0,
    activeRoutes: []
  });

  const BAKU_COORDINATES = { lat: 40.3893, lng: 49.8474 };
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => BAKU_COORDINATES.lat, lng: () => BAKU_COORDINATES.lng },
      radius: 200 * 1000,
    },
    debounce: 300,
  });

  useEffect(() => {
    if (hospital) {
      setFormData({
        ...hospital,
        specialties: hospital.specialties.join(', '),
        latitude: hospital.location.coordinates[1],
        longitude: hospital.location.coordinates[0],
        totalICU: hospital.totalICU || 0,
        availableICU: hospital.availableICU || 0,
        totalOR: hospital.totalOR || 0,
        availableOR: hospital.availableOR || 0,
        activeRoutes: hospital.activeRoutes || []
      });
      setValue(hospital.address, false);
    }
  }, [hospital, setValue]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setFormData(prev => ({
        ...prev,
        address,
        latitude: lat,
        longitude: lng,
      }));
    } catch (error) {
      toast.error("Failed to get coordinates for the selected address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please provide a name for the hospital.');
      return;
    }
    if (!formData.address) {
      toast.error('Please provide an address for the hospital.');
      return;
    }
    if (!formData.phone) {
      toast.error('Please provide a phone number for the hospital.');
      return;
    }
    if (!formData.operatingHours) {
      toast.error('Please specify the operating hours.');
      return;
    }
    if (formData.totalBeds < 0) {
      toast.error('Total beds cannot be negative.');
      return;
    }
    if (formData.availableBeds < 0 || formData.availableBeds > formData.totalBeds) {
      toast.error('Available beds must be between 0 and the total number of beds.');
      return;
    }
    if (formData.totalICU < 0) {
      toast.error('Total ICU beds cannot be negative.');
      return;
    }
    if (formData.availableICU < 0 || formData.availableICU > formData.totalICU) {
      toast.error('Available ICU beds must be between 0 and the total number of ICU beds.');
      return;
    }
    if (formData.totalOR < 0) {
      toast.error('Total operating rooms cannot be negative.');
      return;
    }
    if (formData.availableOR < 0 || formData.availableOR > formData.totalOR) {
      toast.error('Available operating rooms must be between 0 and the total number of operating rooms.');
      return;
    }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      toast.error('Please provide a valid latitude.');
      return;
    }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      toast.error('Please provide a valid longitude.');
      return;
    }

    try {
      const hospitalData = {
        ...formData,
        specialties: formData.specialties.split(',').map(s => s.trim()),
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        }
      };
      delete hospitalData.latitude;
      delete hospitalData.longitude;

      onSubmit(hospitalData);
    } catch (error) {
      toast.error('Failed to process hospital data');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
        <Combobox onSelect={handleSelect}>
          <ComboboxInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Search an address"
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
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="operatingHours" className="block text-sm font-medium text-gray-700">Operating Hours</label>
        <input
          type="text"
          name="operatingHours"
          id="operatingHours"
          required
          value={formData.operatingHours}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="totalBeds" className="block text-sm font-medium text-gray-700">Total Beds</label>
        <input
          type="number"
          name="totalBeds"
          id="totalBeds"
          required
          value={formData.totalBeds}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="availableBeds" className="block text-sm font-medium text-gray-700">Available Beds</label>
        <input
          type="number"
          name="availableBeds"
          id="availableBeds"
          required
          value={formData.availableBeds}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="totalICU" className="block text-sm font-medium text-gray-700">Total ICU Beds</label>
        <input
          type="number"
          name="totalICU"
          id="totalICU"
          value={formData.totalICU}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="availableICU" className="block text-sm font-medium text-gray-700">Available ICU Beds</label>
        <input
          type="number"
          name="availableICU"
          id="availableICU"
          value={formData.availableICU}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="totalOR" className="block text-sm font-medium text-gray-700">Total Operating Rooms</label>
        <input
          type="number"
          name="totalOR"
          id="totalOR"
          value={formData.totalOR}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="availableOR" className="block text-sm font-medium text-gray-700">Available Operating Rooms</label>
        <input
          type="number"
          name="availableOR"
          id="availableOR"
          value={formData.availableOR}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">Specialties (comma-separated)</label>
        <input
          type="text"
          name="specialties"
          id="specialties"
          value={formData.specialties}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          id="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
          <option value="Full">Full</option>
        </select>
      </div>
      <button
        type="submit"
        className="mt-4 w-full rounded-md bg-blue-600 text-white py-2 hover:bg-blue-700"
      >
        {hospital ? 'Update Hospital' : 'Add Hospital'}
      </button>
    </form>
  );
}











