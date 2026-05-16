export interface LocationRecord {
  village: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  formattedAddress?: string;
  lastUpdated: string;
}

export interface LiveLocation extends LocationRecord {}

export interface AcquireLocationOptions {
  onProgress?: (msg: string) => void;
  previousLocation?: Pick<LocationRecord, "latitude" | "longitude" | "accuracy"> | null;
}

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const SAMPLE_COUNT = 3;
const SAMPLE_INTERVAL_MS = 2000;
const ACCEPTABLE_ACCURACY_METERS = 300;
const STABLE_JUMP_KM = 5;
const STORAGE_KEY = "farmlink_last_stable_location";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const progress = (handler: AcquireLocationOptions["onProgress"], message: string) => {
  handler?.(message);
  console.debug("[FarmLink][GPS]", message);
};

const readStoredStableLocation = (): LocationRecord | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocationRecord) : null;
  } catch {
    return null;
  }
};

const storeStableLocation = (location: LocationRecord) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage failures on restricted browsers.
  }
};

const getNavigatorPosition = (): Promise<GeolocationPosition> => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GPS_OPTIONS);
  });
};

const isStrongEnough = (accuracy: number) => accuracy <= ACCEPTABLE_ACCURACY_METERS;

const gpsPermissionMessage = (error: { code?: number }) => {
  if (error.code === 1) {
    return "Please enable PRECISE location in browser/mobile settings.";
  }
  if (error.code === 3) {
    return "GPS timeout. Keep the device outdoors and try again.";
  }
  return "Unable to detect precise GPS right now.";
};

const normalizeCoordinates = (position: GeolocationPosition) => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  timestamp: position.timestamp,
});

const averageCoordinates = (samples: GeolocationPosition[]) => {
  const weightFor = (accuracy: number) => Math.max(1, ACCEPTABLE_ACCURACY_METERS - accuracy);
  const totals = samples.reduce(
    (acc, sample) => {
      const weight = weightFor(sample.coords.accuracy);
      acc.latitude += sample.coords.latitude * weight;
      acc.longitude += sample.coords.longitude * weight;
      acc.accuracy += sample.coords.accuracy;
      acc.weight += weight;
      return acc;
    },
    { latitude: 0, longitude: 0, accuracy: 0, weight: 0 }
  );

  return {
    latitude: totals.latitude / totals.weight,
    longitude: totals.longitude / totals.weight,
    accuracy: totals.accuracy / samples.length,
  };
};

/**
 * Collects 3 GPS samples and returns the best accurate reading.
 */
export async function getHighAccuracyCoordinates(
  optionsOrProgress?: AcquireLocationOptions | AcquireLocationOptions["onProgress"],
  maybePreviousLocation?: AcquireLocationOptions["previousLocation"]
): Promise<GeolocationCoordinates> {
  const options: AcquireLocationOptions =
    typeof optionsOrProgress === "function"
      ? { onProgress: optionsOrProgress, previousLocation: maybePreviousLocation ?? null }
      : optionsOrProgress ?? {};

  const storedLocation = options.previousLocation ?? readStoredStableLocation();
  const samples: GeolocationPosition[] = [];

  for (let sampleIndex = 1; sampleIndex <= SAMPLE_COUNT; sampleIndex += 1) {
    progress(options.onProgress, `Collecting GPS sample ${sampleIndex}/${SAMPLE_COUNT}...`);

    try {
      const position = await getNavigatorPosition();
      samples.push(position);

      console.debug("[FarmLink][GPS] sample", {
        sampleIndex,
        ...normalizeCoordinates(position),
      });
      progress(options.onProgress, `GPS accuracy: ${position.coords.accuracy.toFixed(1)} meters`);
    } catch (error) {
      console.debug("[FarmLink][GPS] sample rejected", { sampleIndex, error });
      if (typeof error === "object" && error && "code" in error) {
        throw new Error(gpsPermissionMessage(error as { code?: number }));
      }
      throw error;
    }

    if (sampleIndex < SAMPLE_COUNT) {
      await delay(SAMPLE_INTERVAL_MS);
    }
  }

  if (samples.length === 0) {
    throw new Error("Could not acquire GPS coordinates.");
  }

  const acceptableSamples = samples
    .filter((sample) => isStrongEnough(sample.coords.accuracy))
    .sort((a, b) => a.coords.accuracy - b.coords.accuracy);

  if (acceptableSamples.length === 0) {
    throw new Error("Weak GPS signal. Please move outdoors or enable precise location.");
  }

  const filteredSamples = acceptableSamples.filter((sample) => {
    if (!storedLocation) return true;
    const jumpKm = calculateDistance(
      storedLocation.latitude,
      storedLocation.longitude,
      sample.coords.latitude,
      sample.coords.longitude
    );

    if (jumpKm > STABLE_JUMP_KM) {
      console.debug("[FarmLink][GPS] rejected jump", {
        jumpKm,
        previous: storedLocation,
        candidate: normalizeCoordinates(sample),
      });
      return false;
    }

    return true;
  });

  if (filteredSamples.length === 0) {
    throw new Error("GPS coordinates were too unstable. Please try again outdoors.");
  }

  const selectedSample = filteredSamples[0];
  const averaged = averageCoordinates(filteredSamples);
  progress(options.onProgress, `Selected GPS fix with accuracy ${averaged.accuracy.toFixed(1)}m.`);
  console.debug("[FarmLink][GPS] selected coordinates", {
    bestSample: normalizeCoordinates(selectedSample),
    averaged,
  });

  if (!isStrongEnough(averaged.accuracy)) {
    throw new Error("Weak GPS signal. Please move outdoors or enable precise location.");
  }

  return {
    ...selectedSample.coords,
    latitude: averaged.latitude,
    longitude: averaged.longitude,
    accuracy: averaged.accuracy,
  };
}

const pickAddressValue = (address: Record<string, string | undefined>, keys: string[], fallback: string) => {
  for (const key of keys) {
    const value = address[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
};

/**
 * Reverse geocodes coordinates using OpenStreetMap Nominatim and prefers rural address parts.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  onProgress?: (msg: string) => void
): Promise<Omit<LiveLocation, "latitude" | "longitude" | "accuracy" | "lastUpdated">> {
  progress(onProgress, "Resolving village, district, and PIN from GPS...");

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("accept-language", "en");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    const address = (data.address || {}) as Record<string, string | undefined>;

    console.debug("[FarmLink][GPS] reverse geocoding response", {
      displayName: data.display_name,
      address,
    });

    const village = pickAddressValue(
      address,
      ["village", "suburb", "locality", "hamlet", "neighbourhood"],
      ""
    );

    const district = pickAddressValue(
      address,
      ["district", "county", "city_district", "municipality", "state_district", "city"],
      ""
    );

    const state = pickAddressValue(address, ["state", "region", "province"], "");
    const pincode = pickAddressValue(address, ["postcode"], "");
    const formattedAddress = typeof data.display_name === "string" ? data.display_name : "";

    return {
      village: village || district || state || "Unknown Location",
      district: district || state || "Unknown District",
      state: state || "Unknown State",
      pincode,
      formattedAddress,
    };
  } catch (error) {
    console.error("[FarmLink][GPS] reverse geocoding error", error);
    return {
      village: "Unknown Location",
      district: "Unknown District",
      state: "Unknown State",
      pincode: "",
      formattedAddress: "",
    };
  }
}

/**
 * Fully acquires a complete LiveLocation profile.
 */
export async function acquireLiveLocation(
  optionsOrProgress?: AcquireLocationOptions | AcquireLocationOptions["onProgress"],
  maybePreviousLocation?: AcquireLocationOptions["previousLocation"]
): Promise<LiveLocation> {
  const options: AcquireLocationOptions =
    typeof optionsOrProgress === "function"
      ? { onProgress: optionsOrProgress, previousLocation: maybePreviousLocation ?? null }
      : optionsOrProgress ?? {};

  const coords = await getHighAccuracyCoordinates(options);
  const geo = await reverseGeocode(coords.latitude, coords.longitude, options.onProgress);

  const location: LiveLocation = {
    ...geo,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    lastUpdated: new Date().toISOString(),
  };

  storeStableLocation(location);
  return location;
}

export const formatVillagePin = (location: Pick<LiveLocation, "village" | "pincode">) => {
  return location.pincode ? `${location.village} (${location.pincode})` : location.village;
};

export const formatLiveLocationLabel = (location: Pick<LiveLocation, "village" | "state" | "latitude" | "longitude">) => {
  return `${location.village}, ${location.state} • ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
