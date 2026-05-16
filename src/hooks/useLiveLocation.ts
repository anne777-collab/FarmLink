import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { acquireLiveLocation, LiveLocation, LocationRecord } from "../utils/location";

export interface UseLiveLocationResult {
  location: LiveLocation | null;
  isDetecting: boolean;
  status: string | null;
  error: string | null;
  refreshLocation: (previousLocation?: Pick<LocationRecord, "latitude" | "longitude" | "accuracy"> | null) => Promise<LiveLocation>;
  setLocation: Dispatch<SetStateAction<LiveLocation | null>>;
  clearError: () => void;
}

export const useLiveLocation = (initialLocation: LiveLocation | null = null): UseLiveLocationResult => {
  const [location, setLocation] = useState<LiveLocation | null>(initialLocation);
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = useCallback(
    async (previousLocation?: Pick<LocationRecord, "latitude" | "longitude" | "accuracy"> | null) => {
      setIsDetecting(true);
      setError(null);
      setStatus("📍 Detecting precise GPS...");

      try {
        const nextLocation = await acquireLiveLocation({
          previousLocation: previousLocation ?? location ?? undefined,
          onProgress: setStatus,
        });
        setLocation(nextLocation);
        setStatus("📍 Location detected successfully.");
        return nextLocation;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to detect location right now.";
        setError(message);
        setStatus(null);
        throw err;
      } finally {
        setIsDetecting(false);
      }
    },
    [location]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    location,
    isDetecting,
    status,
    error,
    refreshLocation,
    setLocation,
    clearError,
  };
};

export default useLiveLocation;
