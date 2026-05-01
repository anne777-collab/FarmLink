// src/utils/helpers.js

export const WORK_TYPES = [
  { value: "cutting", label: "Cutting / काटना" },
  { value: "harvesting", label: "Harvesting / फसल काटना" },
  { value: "planting", label: "Planting / बुआई" },
  { value: "irrigation", label: "Irrigation / सिंचाई" },
  { value: "spraying", label: "Spraying / छिड़काव" },
  { value: "general", label: "General Labour / सामान्य मजदूरी" },
];

export const WORK_TYPE_MAP = Object.fromEntries(
  WORK_TYPES.map((w) => [w.value, w.label])
);

export const calcDistance = (lat1, lon1, lat2, lon2) => {
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (distance) => {
  if (distance == null || !Number.isFinite(distance)) return "";
  if (distance < 1) return "Nearby";

  const speed = 40; // km/h
  const time = (distance / speed) * 60;
  return `${distance.toFixed(1)} km • ${Math.round(time)} min`;
};

export const formatDate = (ts) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
};
