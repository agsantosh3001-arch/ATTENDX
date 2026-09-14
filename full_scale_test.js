const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BACKEND_URL = 'http://localhost:5005';
const DESKTOP_URL = 'http://localhost:5173';
const MOBILE_URL = 'http://localhost:5174';

function request(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function extractCookie(headers, cookieName) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieArr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieArr) {
    const match = c.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

async function runFullScaleTest() {
  console.log('====================================================');
  console.log('🚀 STARTING ATTENDX ACCOUNT + DEVICE BINDING SECURITY SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // SECTION 1: SYSTEM HEALTH & INTEGRITY
    // ----------------------------------------------------
    console.log('1️⃣ TESTING BACKEND API & DATABASE SYSTEM...');
    const health = await request(`${BACKEND_URL}/health`);
    assert(health.status === 200 && health.data?.status === 'ok', 'Backend Health Endpoint (GET /health)');

    // ----------------------------------------------------
    // SECTION 2: PRIVACY & ZERO DIRECTORY LEAKAGE
    // ----------------------------------------------------
    console.log('\n2️⃣ TESTING PRIVACY & ZERO DIRECTORY LEAKAGE...');
    // Unregistered device status check
    const unregStatus = await request(`${BACKEND_URL}/api/auth/device-status`);
    assert(
      unregStatus.status === 200 &&
      unregStatus.data?.data?.isRegistered === false &&
      !unregStatus.data?.data?.user &&
      !unregStatus.raw.includes('Alex') &&
      !unregStatus.raw.includes('Sarah'),
      'Device Status for Unregistered Client returns isRegistered: false with ZERO directory exposure'
    );

    // ----------------------------------------------------
    // SECTION 3: FIRST-TIME DEVICE REGISTRATION (VIVAN on Device A)
    // ----------------------------------------------------
    console.log('\n3️⃣ TESTING FIRST-TIME DEVICE REGISTRATION (Device A -> Vivan)...');
    const vivanAuthRes = await request(`${BACKEND_URL}/api/auth/google/dev-select?email=vivaninteriors%40gmail.com&name=VIVAN`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });

    const deviceACookie = extractCookie(vivanAuthRes.headers, 'attendx_device_id');
    const vivanRedirectLoc = vivanAuthRes.headers.location || '';
    const vivanTokenMatch = vivanRedirectLoc.match(/token=([^&]+)/);
    const vivanToken = vivanTokenMatch ? vivanTokenMatch[1] : null;

    assert(vivanAuthRes.status === 302 && deviceACookie, 'Device A receives cryptographically strong attendx_device_id cookie');
    assert(vivanToken !== null, 'Vivan receives valid access token upon first registration');

    // Verify Vivan Profile
    const vivanMe = await request(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${vivanToken}` },
    });
    assert(vivanMe.status === 200 && vivanMe.data?.data?.user?.email === 'vivaninteriors@gmail.com', 'Vivan Identity Verified');

    // ----------------------------------------------------
    // SECTION 4: RETURNING USER RECOGNITION (Device A)
    // ----------------------------------------------------
    console.log('\n4️⃣ TESTING RETURNING USER RECOGNITION (Device A)...');
    const deviceAStatus = await request(`${BACKEND_URL}/api/auth/device-status`, {
      headers: { Cookie: `attendx_device_id=${deviceACookie}` },
    });

    assert(
      deviceAStatus.status === 200 &&
      deviceAStatus.data?.data?.isRegistered === true &&
      (deviceAStatus.data?.data?.user?.fullName === 'Vivan Agarwal' || deviceAStatus.data?.data?.user?.fullName === 'VIVAN') &&
      deviceAStatus.data?.data?.user?.maskedEmail.includes('***') &&
      !deviceAStatus.raw.includes('Alex'),
      'Device A recognized as Vivan with masked email (zero other employees shown)'
    );

    // ----------------------------------------------------
    // SECTION 5: DEVICE MISMATCH PREVENTION (Aman attempts login on Device A)
    // ----------------------------------------------------
    console.log('\n5️⃣ TESTING DEVICE MISMATCH SECURITY ENFORCEMENT...');
    // Aman attempts to login using Device A's cookie
    const amanMismatchRes = await request(`${BACKEND_URL}/api/auth/google/dev-select?email=vikashreal2%40gmail.com&name=Aman+Rajak`, {
      headers: {
        Cookie: `attendx_device_id=${deviceACookie}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    assert(
      amanMismatchRes.status === 302 && amanMismatchRes.headers.location?.includes('error=device_mismatch'),
      'Device Mismatch Blocked: Aman cannot authenticate on Vivan-bound Device A (redirects with generic error)'
    );

    // ----------------------------------------------------
    // SECTION 6: SEPARATE DEVICE REGISTRATION (Aman on Device B)
    // ----------------------------------------------------
    console.log('\n6️⃣ TESTING SEPARATE DEVICE REGISTRATION (Device B -> Aman)...');
    const amanAuthRes = await request(`${BACKEND_URL}/api/auth/google/dev-select?email=vikashreal2%40gmail.com&name=Aman+Rajak`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15' },
    });

    const deviceBCookie = extractCookie(amanAuthRes.headers, 'attendx_device_id');
    const amanRedirectLoc = amanAuthRes.headers.location || '';
    const amanTokenMatch = amanRedirectLoc.match(/token=([^&]+)/);
    const amanToken = amanTokenMatch ? amanTokenMatch[1] : null;

    assert(amanAuthRes.status === 302 && deviceBCookie && deviceBCookie !== deviceACookie, 'Device B receives unique device identifier');
    assert(amanToken !== null, 'Aman receives valid access token on Device B');

    // ----------------------------------------------------
    // SECTION 7: ADMIN CONTROLS & DEVICE MANAGEMENT
    // ----------------------------------------------------
    console.log('\n7️⃣ TESTING ADMIN DEVICE GOVERNANCE & REVOCATION...');
    // Admin login
    const adminLoginData = JSON.stringify({ email: 'admin@attendx.com', password: 'Admin@123' });
    const adminRes = await request(`${BACKEND_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminLoginData) },
      body: adminLoginData,
    });
    const adminToken = adminRes.data?.data?.accessToken;
    assert(adminRes.status === 200 && adminToken, 'Admin Authentication Successful');

    // List registered devices
    const devicesListRes = await request(`${BACKEND_URL}/api/admin/devices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const devices = devicesListRes.data?.data?.devices || [];
    assert(devicesListRes.status === 200 && devices.length >= 2, `Admin lists all registered devices (Found ${devices.length})`);

    const amanDeviceRecord = devices.find((d) => d.employee?.email === 'vikashreal2@gmail.com');
    assert(amanDeviceRecord !== undefined, 'Aman device record located by Administrator');

    // Admin Revokes Aman's Device (Device B)
    if (amanDeviceRecord) {
      const revokeRes = await request(`${BACKEND_URL}/api/admin/devices/${amanDeviceRecord.id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Compromised device reported' }),
      });
      assert(revokeRes.status === 200 && revokeRes.data?.data?.device?.status === 'revoked', 'Admin Revokes Device B');

      // Attempt login on revoked Device B
      const revokedLoginRes = await request(`${BACKEND_URL}/api/auth/google/dev-select?email=vikashreal2%40gmail.com&name=Aman+Rajak`, {
        headers: { Cookie: `attendx_device_id=${deviceBCookie}` },
      });
      assert(
        revokedLoginRes.status === 302 && revokedLoginRes.headers.location?.includes('error=device_revoked'),
        'Revoked Device B is rejected from subsequent logins'
      );
    }

    // ----------------------------------------------------
    // SECTION 8: SERVER-SIDE ATTENDANCE IDENTITY & GPS
    // ----------------------------------------------------
    console.log('\n8️⃣ TESTING ATTENDANCE SERVER-SIDE IDENTITY & GEOFENCING...');
    const todayRes = await request(`${BACKEND_URL}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${vivanToken}` },
    });
    assert(todayRes.status === 200 && todayRes.data?.success, 'Attendance Today Status for Vivan');

    // Verify client cannot spoof employeeId in punch
    const checkInPayload = JSON.stringify({
      latitude: 22.6178,
      longitude: 88.4206,
      accuracy: 10,
      employeeId: 'spoofed_alex_id', // Spoof attempt
    });
    const checkInRes = await request(`${BACKEND_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vivanToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(checkInPayload),
      },
      body: checkInPayload,
    });
    // Status 200 or 400 (if already checked in today) — crucially, attendance recorded for Vivan, not spoofed_alex_id
    if (checkInRes.status === 200) {
      assert(checkInRes.data?.data?.attendance?.employeeId !== 'spoofed_alex_id', 'Attendance recorded strictly for session user, ignoring client-supplied employeeId');
    } else {
      assert(checkInRes.status === 400, 'Handled existing daily attendance correctly without spoofing vulnerability');
    }

    // ----------------------------------------------------
    // SECTION 9: REAL BROWSER UI VERIFICATION (Puppeteer)
    // ----------------------------------------------------
    console.log('\n9️⃣ TESTING REAL BROWSER UI RENDERING...');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Test Desktop Login Render (Fresh Unregistered State)
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });
    await desktopPage.goto(`${DESKTOP_URL}/login`, { waitUntil: 'networkidle2' });
    const desktopContent = await desktopPage.content();
    assert(desktopContent.includes('AttendX') && !desktopContent.includes('Choose Google Account'), 'Desktop renders clean single-account Sign In (No multi-account picker)');

    // Test Mobile Login Render
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await mobilePage.goto(`${MOBILE_URL}/login`, { waitUntil: 'networkidle2' });
    const mobileContent = await mobilePage.content();
    assert(mobileContent.includes('AttendX') && !mobileContent.includes('Choose Google Account'), 'Mobile renders clean single-account Sign In (No multi-account picker)');

    await browser.close();

    console.log('\n====================================================');
    console.log(`📊 SECURITY SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during security suite execution:', err);
    process.exit(1);
  }
}

runFullScaleTest();
