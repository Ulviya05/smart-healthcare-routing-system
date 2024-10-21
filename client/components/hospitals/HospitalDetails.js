import { useState, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Phone, Clock, Users, Ambulance, ClipboardList } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultMapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi.business",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export default function HospitalDetails({ hospital }) {
  const [activeTab, setActiveTab] = useState('info');
  const [directions, setDirections] = useState(null);
  const [directionsSteps, setDirectionsSteps] = useState([]);
  const [isRouteVisible, setIsRouteVisible] = useState(false);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'location', label: 'Location' }
  ];

  const hospitalLocation = hospital.location?.coordinates ? {
    lat: hospital.location.coordinates[1],
    lng: hospital.location.coordinates[0]
  } : null;

  const onLoad = useCallback((map) => {
    setMap(map);
    if (hospitalLocation) {
      map.panTo(hospitalLocation);
      map.setZoom(15); 
    }
  }, [hospitalLocation]);

  const calculateAndDisplayRoute = useCallback(async (origin) => {
    if (!hospitalLocation || !origin) return;
    
    setIsLoading(true);

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: origin,
            destination: hospitalLocation,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
            optimizeWaypoints: true,
          },
          (result, status) => {
            if (status === 'OK') {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      setDirections(result);
      setIsRouteVisible(true);
      
      const steps = result.routes[0].legs[0].steps.map((step, index) => ({
        id: index,
        instruction: step.instructions,
        distance: step.distance.text,
        duration: step.duration.text
      }));
      
      setDirectionsSteps(steps);
      
      if (map) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(hospitalLocation);
        map.fitBounds(bounds);
      }
      
    } catch (error) {
      console.error('Error calculating route:', error);
      setDirections(null);
      setDirectionsSteps([]);
      setIsRouteVisible(false);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalLocation, map]);

  const handleGetDirections = useCallback(() => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        calculateAndDisplayRoute(origin);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        setDirections(null);
        setDirectionsSteps([]);
        setIsRouteVisible(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [calculateAndDisplayRoute]);

  const openInGoogleMaps = useCallback(() => {
    if (hospitalLocation) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.lat},${hospitalLocation.lng}`;
      window.open(mapsUrl, '_blank');
    }
  }, [hospitalLocation]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
          <div className="flex items-center gap-3">
            {hospital.isEmergencyAvailable && (
              <span className="flex items-center gap-1">
                <Ambulance className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500 font-medium">Emergency Available</span>
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              hospital.status === 'Available' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {hospital.status}
            </span>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={MapPin} label="Address" value={hospital.address} />
                <InfoItem icon={Phone} label="Phone" value={hospital.phone} />
                <InfoItem icon={Clock} label="Hours" value={hospital.operatingHours} />
                <InfoItem
                  icon={ClipboardList}
                  label="Specialties"
                  value={hospital.specialties.join(', ')}
                />
                {hospital.emergencyServices && (
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium mb-2">Emergency Services</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {hospital.emergencyServices.map((service, index) => (
                        <li key={index} className="text-sm text-gray-600">{service}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'capacity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CapacityCard
                  title="Emergency Room"
                  icon={Ambulance}
                  available={hospital.availableBeds || 0}
                  total={hospital.totalBeds || 0}
                  waitTime={hospital.erWaitTime}
                />
                <CapacityCard
                  title="ICU"
                  icon={Users}
                  available={hospital.availableICU || 0}
                  total={hospital.totalICU || 0}
                />
                <CapacityCard
                  title="Operating Rooms"
                  available={hospital.availableOR || 0}
                  total={hospital.totalOR || 0}
                />
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="relative">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={hospitalLocation}
                  zoom={15}
                  onLoad={onLoad}
                  options={defaultMapOptions}
                >
                  {hospitalLocation && (
                    <Marker
                      position={hospitalLocation}
                      icon={{
                        url: hospital.isEmergencyAvailable 
                          ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                          : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
                    />
                  )}
                  {isRouteVisible && directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: '#2563eb',
                          strokeWeight: 5,
                          strokeOpacity: 0.8
                        }
                      }}
                    />
                  )}
                </GoogleMap>

                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={openInGoogleMaps}
                    className="px-3 py-2 bg-white text-gray-700 rounded shadow-md hover:bg-gray-50 text-sm font-medium"
                  >
                    Open in Google Maps
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleGetDirections}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Getting Directions...' : 'Get Directions from My Location'}
                </button>
              </div>

              {directionsSteps.length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Step by Step Directions</h3>
                    {directions?.routes[0]?.legs[0] && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Total: </span>
                        {directions.routes[0].legs[0].distance.text}
                        <span className="mx-2">•</span>
                        {directions.routes[0].legs[0].duration.text}
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-200">
                    {directionsSteps.map((step) => (
                      <div key={step.id} className="py-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                            {step.id + 1}
                          </div>
                          <div className="ml-3">
                            <div 
                              className="text-sm text-gray-900"
                              dangerouslySetInnerHTML={{ __html: step.instruction }}
                            />
                            <div className="mt-1 text-xs text-gray-500">
                              {step.distance} • {step.duration}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

function CapacityCard({ title, icon: Icon, available, total, waitTime }) {
  const percentage = total ? (available / total) * 100 : 0;
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{available} available</span>
          <span className="text-gray-500">Total: {total}</span>
        </div>
        <div className="mt-2 relative">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        {waitTime && (
          <div className="mt-2 text-sm text-gray-500">
            Current wait time: {waitTime}
          </div>
        )}
      </div>
    </div>
  );
}