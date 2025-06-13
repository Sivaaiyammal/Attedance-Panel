import { Location } from '../types';

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address from coordinates (using a reverse geocoding service)
          const address = await getAddressFromCoordinates(latitude, longitude);
          resolve({
            latitude,
            longitude,
            address
          });
        } catch (error) {
          // Even if address lookup fails, return coordinates
          resolve({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });
        }
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Error getting address:', error);
  }
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};