import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { socket } from '@/services/socket';
import { getAllEmergencies } from '@/services/emergency';

const EMERGENCY_TIMEFRAME = 1 * 60 * 60 * 1000;
const RECENT_THRESHOLD = 30 * 60 * 1000;
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '600px'
};

const DEFAULT_MAP_OPTIONS = {
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  zoomControl: true
};

const LOADER_CONFIG = {
  id: 'google-maps-loader',
  libraries: ['places'],
  version: 'weekly'
};

const getEmergencyStatus = (createdAt) => {
  const age = Date.now() - new Date(createdAt).getTime();
  if (age <= RECENT_THRESHOLD) return 'NEW';
  if (age <= EMERGENCY_TIMEFRAME) return 'ACTIVE';
  return 'OUTDATED';
};

export default function UnifiedEmergencyMap({
  defaultCenter = { lat: 40.4093, lng: 49.8671 },
  patientLocation = null,
  hospitalLocation = null,
  showAllHospitals = true
}) {
  const [map, setMap] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    ...LOADER_CONFIG
  });

  useEffect(() => {
    if (!map || !patientLocation || !hospitalLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    const origin = { lat: patientLocation[1], lng: patientLocation[0] };
    const destination = { lat: hospitalLocation[1], lng: hospitalLocation[0] };

    directionsService.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        const route = result.routes[0].legs[0];
        setRouteInfo({
          distance: route.distance.text,
          duration: route.duration.text
        });

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);
      }
    });
  }, [map, patientLocation, hospitalLocation]);

  useEffect(() => {
    if (!showAllHospitals) return;

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
            emergency => getEmergencyStatus(emergency.createdAt) !== 'OUTDATED'
          );
          setEmergencies(activeEmergencies);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showAllHospitals]);

  useEffect(() => {
    if (!showAllHospitals) return;

    const handleHospitalUpdate = (updatedHospital) => {
      setHospitals(prevHospitals => 
        prevHospitals.map(hospital => 
          hospital.id === updatedHospital.id ? updatedHospital : hospital
        )
      );
    };

    const handleNewEmergency = (emergency) => {
      setEmergencies(prev => [...prev, emergency]);
    };

    const handleEmergencyUpdate = (updatedEmergency) => {
      setEmergencies(prev => 
        prev.map(emergency => 
          emergency.id === updatedEmergency.id ? updatedEmergency : emergency
        )
      );
    };

    const handleEmergencyResolution = (emergencyId) => {
      setEmergencies(prev => prev.filter(emergency => emergency.id !== emergencyId));
      if (selectedEmergency?.id === emergencyId) {
        setSelectedEmergency(null);
      }
    };

    socket.on('hospital-status-change', handleHospitalUpdate);
    socket.on('new-emergency', handleNewEmergency);
    socket.on('emergency-update', handleEmergencyUpdate);
    socket.on('emergency-resolved', handleEmergencyResolution);

    return () => {
      socket.off('hospital-status-change');
      socket.off('new-emergency');
      socket.off('emergency-update');
      socket.off('emergency-resolved');
    };
  }, [showAllHospitals, selectedEmergency]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] bg-white rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-[600px] bg-white rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center">
        <div className="text-red-500">Error loading maps</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-white rounded-lg overflow-hidden relative shadow-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={defaultCenter}
        zoom={12}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        {patientLocation && (
          <Marker
            position={{
              lat: patientLocation[1],
              lng: patientLocation[0]
            }}
            label={{
              text: "P",
              color: "white",
              fontWeight: "bold"
            }}
            title="Patient Location"
          />
        )}

        {hospitalLocation && (
          <Marker
            position={{
              lat: hospitalLocation[1],
              lng: hospitalLocation[0]
            }}
            label={{
              text: "H",
              color: "white",
              fontWeight: "bold"
            }}
            title="Hospital Location"
          />
        )}

        {showAllHospitals && hospitals.map(hospital => (
          <Marker
            key={hospital.id}
            position={{
              lat: hospital.location.coordinates[1],
              lng: hospital.location.coordinates[0]
            }}
            onClick={() => setSelectedHospital(hospital)}
            label={{
              text: "H",
              color: "white",
              fontWeight: "bold"
            }}
            title={hospital.name}
          />
        ))}

        {showAllHospitals && emergencies.map(emergency => (
          <Marker
            key={emergency.id}
            position={{
              lat: emergency.location.coordinates[1],
              lng: emergency.location.coordinates[0]
            }}
            onClick={() => setSelectedEmergency(emergency)}
            label={{
              text: "E",
              color: "white",
              fontWeight: "bold"
            }}
            title={`Emergency #${emergency.id}`}
          />
        ))}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#2563eb',
                strokeOpacity: 0.8,
                strokeWeight: 5
              }
            }}
          />
        )}
      </GoogleMap>

      {routeInfo && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-900">Route Information</div>
          <div className="mt-1 text-sm text-gray-600">
            <div>Distance: {routeInfo.distance}</div>
            <div>Estimated Time: {routeInfo.duration}</div>
          </div>
        </div>
      )}
    </div>
  );
}