const axios = require('axios');

// Reverse geocoding to get address from coordinates
async function getAddressFromCoordinates(latitude, longitude) {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'AI-Guardian-Safety-App'
      }
    });

    if (response.data && response.data.display_name) {
      return {
        success: true,
        address: response.data.display_name,
        details: {
          road: response.data.address?.road,
          city: response.data.address?.city || response.data.address?.town || response.data.address?.village,
          state: response.data.address?.state,
          country: response.data.address?.country,
          postcode: response.data.address?.postcode
        }
      };
    } else {
      return {
        success: false,
        address: `${latitude}, ${longitude}`,
        error: 'Address not found'
      };
    }

  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      success: false,
      address: `${latitude}, ${longitude}`,
      error: error.message
    };
  }
}

// Get coordinates from address (forward geocoding)
async function getCoordinatesFromAddress(address) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'AI-Guardian-Safety-App'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        success: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name
      };
    } else {
      return {
        success: false,
        error: 'Coordinates not found for the given address'
      };
    }

  } catch (error) {
    console.error('Forward geocoding error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Check if location is in a safe zone (predefined safe areas)
function isSafeZone(latitude, longitude) {
  // Define safe zones (e.g., police stations, hospitals, schools)
  const safeZones = [
    { name: 'Police Station Area', lat: 28.6139, lon: 77.2090, radius: 0.5 }, // Example Delhi
    { name: 'Hospital Area', lat: 28.6289, lon: 77.2065, radius: 0.3 },
    { name: 'Metro Station', lat: 28.6122, lon: 77.2273, radius: 0.2 }
  ];

  for (const zone of safeZones) {
    const distance = calculateDistance(latitude, longitude, zone.lat, zone.lon);
    if (distance <= zone.radius) {
      return {
        isSafe: true,
        zone: zone.name,
        distance: distance.toFixed(2)
      };
    }
  }

  return {
    isSafe: false,
    zone: null,
    distance: null
  };
}

module.exports = {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  calculateDistance,
  isSafeZone
};
