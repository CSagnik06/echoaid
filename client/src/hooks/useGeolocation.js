import { useCallback, useEffect, useState } from "react";
const demo = { latitude: 22.5726, longitude: 88.3639 };
function useGeolocation() {
  const [position, setPosition] = useState(demo), [loading, setLoading] = useState(true), [error, setError] = useState();
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS unavailable \u2014 using Kolkata demo location");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition((p) => {
      setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude });
      setError(void 0);
      setLoading(false);
    }, () => {
      setError("GPS unavailable \u2014 using Kolkata demo location");
      setLoading(false);
    }, { enableHighAccuracy: true, timeout: 7e3 });
  }, []);
  useEffect(() => {
    locate();
  }, [locate]);
  return { ...position, loading, error, refresh: locate };
}
export {
  useGeolocation
};
