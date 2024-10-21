import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultMapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: true
};

const LOADER_CONFIG = {
  id: 'google-maps-loader',
  libraries: ['places'],
  version: 'weekly'
};

const EmergencyMap = ({ patientLocation, hospitalLocation }) => {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    ...LOADER_CONFIG
  });

  const patientCoords = patientLocation ? {
    lat: patientLocation[1],
    lng: patientLocation[0]
  } : null;

  const hospitalCoords = hospitalLocation ? {
    lat: hospitalLocation[1],
    lng: hospitalLocation[0]
  } : null;

  useEffect(() => {
    if (!map || !patientCoords || !hospitalCoords) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: patientCoords,
        destination: hospitalCoords,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          const route = result.routes[0].legs[0];
          setRouteInfo({
            distance: route.distance.text,
            duration: route.duration.text
          });
        } else {
          setError('Failed to calculate route');
        }
      }
    );
  }, [map, patientCoords, hospitalCoords]);

  const onLoad = useCallback((map) => {
    if (!patientCoords || !hospitalCoords) return;

    setMap(map);
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(patientCoords);
    bounds.extend(hospitalCoords);
    map.fitBounds(bounds);
  }, [patientCoords, hospitalCoords]);

  const onUnmount = useCallback(() => {
    setMap(null);
    setDirections(null);
    setRouteInfo(null);
    setError(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">
          Error loading Google Maps. Please try again later.
        </div>
      </div>
    );
  }

  if (!patientCoords || !hospitalCoords) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">
          Invalid location data. Please check the coordinates.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        options={defaultMapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Marker
          position={patientCoords}
          label={{
            text: "P",
            color: "white",
            fontWeight: "bold"
          }}
          title="Patient Location"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
          }}
        />

        <Marker
          position={hospitalCoords}
          label={{
            text: "H",
            color: "white",
            fontWeight: "bold"
          }}
          title="Hospital Location"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
          }}
        />

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#2563eb',
                strokeWeight: 5,
                strokeOpacity: 0.8
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

      {error && (
        <div className="absolute top-4 left-4 bg-red-50 p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}
    </div>
  );
};

export default EmergencyMap;







