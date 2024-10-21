import React, { useState, useEffect } from 'react';
import { Hospital, Users, Search, Clock, Ambulance, ChevronLeft, ChevronRight } from 'lucide-react';
import { socket } from '../../services/socket';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const HospitalList = ({ selectedHospital, onHospitalSelect }) => {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch hospitals');
        }
        
        const data = await response.json();
        setHospitals(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  useEffect(() => {
    const handleHospitalCapacityUpdate = (updatedHospital) => {
      setHospitals(prev => prev.map(hospital => 
        hospital._id === updatedHospital._id ? { ...hospital, ...updatedHospital } : hospital
      ));
    };

    const handleHospitalStatusChange = (update) => {
      setHospitals(prev => prev.map(hospital =>
        hospital._id === update.hospitalId 
          ? { ...hospital, ...update.hospital }
          : hospital
      ));
    };

    const handleNewHospital = (newHospital) => {
      setHospitals(prev => [...prev, newHospital]);
    };

    socket.connect();

    socket.on('hospital-capacity-update', handleHospitalCapacityUpdate);
    socket.on('hospital-status-change', handleHospitalStatusChange);
    socket.on('new-hospital-added', handleNewHospital);

    return () => {
      socket.off('hospital-capacity-update', handleHospitalCapacityUpdate);
      socket.off('hospital-status-change', handleHospitalStatusChange);
      socket.off('new-hospital-added', handleNewHospital);
      socket.disconnect();
    };
  }, []);

  const specialties = [...new Set(hospitals.flatMap(h => h.specialties || []))];

  const calculateOccupancy = (hospital) => {
    const totalCapacity = hospital.totalBeds + hospital.totalICU;
    const availableCapacity = hospital.availableBeds + hospital.availableICU;
    return totalCapacity === 0 ? 0 : ((totalCapacity - availableCapacity) / totalCapacity) * 100;
  };

  const filteredAndSortedHospitals = hospitals
    .filter(hospital => {
      const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hospital.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = filterSpecialty === 'all' || 
                              (hospital.specialties && hospital.specialties.includes(filterSpecialty));
      const matchesStatus = filterStatus === 'all' || hospital.status === filterStatus;
      return matchesSearch && matchesSpecialty && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'availableBeds':
          return (b.availableBeds + b.availableICU) - (a.availableBeds + a.availableICU);
        case 'occupancy':
          return calculateOccupancy(b) - calculateOccupancy(a);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedHospitals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHospitals = filteredAndSortedHospitals.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 w-full h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Hospital className="mr-2" />
          Hospitals Directory
        </h2>
        <span className="text-sm text-gray-500">
          {filteredAndSortedHospitals.length} hospitals
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search hospitals..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="availableBeds">Sort by Available Beds</option>
              <option value="occupancy">Sort by Occupancy</option>
            </select>

            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Full">Full</option>
            </select>
          </div>

          <select
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {paginatedHospitals.map(hospital => (
            <div
              key={hospital._id}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                selectedHospital?._id === hospital._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => onHospitalSelect(hospital)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{hospital.name}</h3>
                  <p className="text-sm text-gray-500">{hospital.address}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(hospital.status)}`}>
                  {hospital.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm text-gray-500">General Beds</div>
                  <div className={`font-semibold ${getCapacityColor(hospital.availableBeds, hospital.totalBeds)}`}>
                    {hospital.availableBeds}/{hospital.totalBeds}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">ICU Beds</div>
                  <div className={`font-semibold ${getCapacityColor(hospital.availableICU, hospital.totalICU)}`}>
                    {hospital.availableICU}/{hospital.totalICU}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Operating Rooms</div>
                  <div className={`font-semibold ${getCapacityColor(hospital.availableOR, hospital.totalOR)}`}>
                    {hospital.availableOR}/{hospital.totalOR}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {hospital.specialties?.map(specialty => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {hospital.activeRoutes?.length > 0 && (
                <div className="flex items-center text-sm text-orange-600 mt-1">
                  <Ambulance className="w-4 h-4 mr-1" />
                  <span>{hospital.activeRoutes.length} active ambulance{hospital.activeRoutes.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 inline mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalList;