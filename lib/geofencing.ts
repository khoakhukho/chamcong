export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationTarget {
  id: number;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface GeofenceResult {
  isValid: boolean;
  nearestLocation: LocationTarget | null;
  distanceMeters: number;
  message: string;
}

/**
 * Haversine Formula to calculate distance between two coordinates in meters
 */
export function calculateDistanceMeters(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Check if the user is inside any of the configured allowed locations
 */
export function checkGeofence(
  userCoord: Coordinates,
  locations: LocationTarget[]
): GeofenceResult {
  if (!locations || locations.length === 0) {
    return {
      isValid: true,
      nearestLocation: null,
      distanceMeters: 0,
      message: 'Chưa cấu hình danh sách địa điểm giới hạn (Chấp nhận mọi vị trí)',
    };
  }

  let minDistance = Infinity;
  let closestLoc: LocationTarget | null = null;

  for (const loc of locations) {
    const dist = calculateDistanceMeters(userCoord, {
      latitude: loc.latitude,
      longitude: loc.longitude,
    });

    if (dist < minDistance) {
      minDistance = dist;
      closestLoc = loc;
    }
  }

  if (!closestLoc) {
    return {
      isValid: false,
      nearestLocation: null,
      distanceMeters: 0,
      message: 'Không tìm thấy địa điểm phù hợp',
    };
  }

  const isValid = minDistance <= closestLoc.radiusMeters;

  return {
    isValid,
    nearestLocation: closestLoc,
    distanceMeters: minDistance,
    message: isValid
      ? `Hợp lệ (Cách ${closestLoc.name} ${minDistance}m, bán kính cho phép ${closestLoc.radiusMeters}m)`
      : `Cảnh báo: Cách ${closestLoc.name} ${minDistance}m (Vượt quá bán kính ${closestLoc.radiusMeters}m)`,
  };
}

/**
 * Reverse Geocoding with fallback
 */
export async function getAddressFromCoordinates(
  coord: Coordinates
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.latitude}&lon=${coord.longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CaritasDalatChamCong/1.0',
        'Accept-Language': 'vi,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // ignore network timeout/fail
  }

  return `Tọa độ GPS: ${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
}
