import { calculateHaversineDistance, validateGpsLocation, OfficeGpsSettings } from '../services/gpsService';
import assert from 'assert';

function runGpsTests() {
  console.log('🧪 Running GPS Service Unit Tests...');

  const officeSettings: OfficeGpsSettings = {
    officeLatitude: 22.5726,
    officeLongitude: 88.3639,
    allowedRadiusMeters: 150,
    gpsAccuracyThresholdMeters: 50,
  };

  // 1. Distance Calculation Test (Same Point)
  const distZero = calculateHaversineDistance(22.5726, 88.3639, 22.5726, 88.3639);
  assert.strictEqual(distZero, 0, 'Distance between identical points should be 0m');
  console.log('✅ PASS: Distance calculation for identical point is 0m');

  // 2. Distance Calculation Test (Slight Offset)
  const distOffset = calculateHaversineDistance(22.5726, 88.3639, 22.5730, 88.3639);
  assert.ok(distOffset > 0 && distOffset < 100, 'Small offset distance should be within ~44m');
  console.log(`✅ PASS: Small offset distance calculated correctly (${distOffset}m)`);

  // 3. Validate GPS Location Inside Radius
  const insideResult = validateGpsLocation(22.5726, 88.3639, 15, officeSettings);
  assert.ok(insideResult.distance <= 150, 'Location inside radius should succeed');
  console.log('✅ PASS: GPS location inside 150m radius validated');

  // 4. Validate GPS Location Poor Accuracy
  try {
    validateGpsLocation(22.5726, 88.3639, 100, officeSettings);
    assert.fail('Should throw POOR_GPS_ACCURACY error for 100m accuracy');
  } catch (err: any) {
    assert.strictEqual(err.code, 'POOR_GPS_ACCURACY');
    console.log('✅ PASS: Poor GPS accuracy (>50m) correctly rejected');
  }

  // 5. Validate GPS Location Outside Radius
  try {
    validateGpsLocation(28.6139, 77.2090, 10, officeSettings); // New Delhi
    assert.fail('Should throw OUTSIDE_RADIUS error for coordinates in New Delhi');
  } catch (err: any) {
    assert.strictEqual(err.code, 'OUTSIDE_RADIUS');
    console.log(`✅ PASS: Out of radius location (${err.details?.distance}m) correctly rejected`);
  }

  console.log('\n🎉 ALL GPS SERVICE TESTS PASSED SUCCESSFULLY!');
}

runGpsTests();
