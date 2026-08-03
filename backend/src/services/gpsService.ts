import { AppError } from '../utils/appError';

export interface OfficeGpsSettings {
  officeLatitude: number;
  officeLongitude: number;
  allowedRadiusMeters: number;
  gpsAccuracyThresholdMeters: number;
}

/**
 * Calculates great-circle distance between two coordinates using the Haversine formula.
 * @returns distance in meters rounded to 2 decimal places.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Validates user GPS coordinates and accuracy against office settings.
 * Throws AppError if accuracy is poor or distance is outside allowed radius.
 */
export function validateGpsLocation(
  userLat: number,
  userLng: number,
  userAccuracy: number,
  officeSettings: OfficeGpsSettings
): { distance: number } {
  // 1. GPS Accuracy Check
  if (userAccuracy > officeSettings.gpsAccuracyThresholdMeters) {
    throw new AppError(
      'POOR_GPS_ACCURACY',
      400,
      `GPS accuracy (${userAccuracy}m) exceeds acceptable threshold (${officeSettings.gpsAccuracyThresholdMeters}m). Please try again with better GPS reception.`,
      {
        accuracy: userAccuracy,
        threshold: officeSettings.gpsAccuracyThresholdMeters,
      }
    );
  }

  // 2. Distance Check
  const distance = calculateHaversineDistance(
    userLat,
    userLng,
    officeSettings.officeLatitude,
    officeSettings.officeLongitude
  );

  if (distance > officeSettings.allowedRadiusMeters) {
    throw new AppError(
      'OUTSIDE_RADIUS',
      400,
      `You are ${distance}m away from the office. You must be within ${officeSettings.allowedRadiusMeters}m to complete this action.`,
      {
        distance,
        allowedRadius: officeSettings.allowedRadiusMeters,
      }
    );
  }

  return { distance };
}
