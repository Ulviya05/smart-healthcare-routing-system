const axios = require('axios');

const calculateDistance = async (origin, destination, apiKey) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${apiKey}`
    );

    if (response.data.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance.value / 1000, 
        duration: Math.ceil(element.duration.value / 60), 
        status: 'OK'
      };
    }
    
    return {
      distance: null,
      duration: null,
      status: 'ERROR'
    };
  } catch (error) {
    console.error('Error calculating distance:', error);
    return {
      distance: null,
      duration: null,
      status: 'ERROR'
    };
  }
};

const calculateHospitalScore = (hospital, emergency, distanceData) => {
  if (!distanceData || distanceData.status === 'ERROR') {
    return Number.MAX_VALUE;
  }

  const weights = {
    distance: 0.3,
    availability: 0.25,
    specialtyMatch: 0.25,
    criticalCare: 0.2
  };

  const distanceScore = Math.min(distanceData.duration / 60, 2) * 50;
  const availabilityScore = ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds) * 100;
  
  const specialtyMatchCount = emergency.specialties.filter(s => 
    hospital.specialties.includes(s)
  ).length;
  const specialtyScore = (1 - (specialtyMatchCount / emergency.specialties.length)) * 100;

  let criticalCareScore = 0;
  if (emergency.requiresICU && hospital.availableICU <= 0) {
    criticalCareScore = 100;
  }
  if (emergency.requiresOR && hospital.availableOR <= 0) {
    criticalCareScore = Math.max(criticalCareScore, 100);
  }

  return (
    distanceScore * weights.distance +
    availabilityScore * weights.availability +
    specialtyScore * weights.specialtyMatch +
    criticalCareScore * weights.criticalCare
  );
};

module.exports = {
  calculateDistance,
  calculateHospitalScore
};
