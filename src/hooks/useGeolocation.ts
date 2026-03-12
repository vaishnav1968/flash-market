'use client';

import { useEffect, useState } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
      }));
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMsg = 'Failed to get location';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'Location permission denied';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMsg = 'Location unavailable';
      } else if (error.code === error.TIMEOUT) {
        errorMsg = 'Location request timeout';
      }
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);
  }, []);

  return state;
}
