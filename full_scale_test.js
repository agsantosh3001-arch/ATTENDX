const puppeteer = require('./frontend/node_modules/puppeteer-core');
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

async function runFullScaleTest() {
  console.log('====================================================');
  console.log('🚀 STARTING ATTENDX FULL-SCALE APPLICATION SUITE TEST');
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
    // SECTION 1: BACKEND HEALTH & DATABASE SYSTEM TEST
    // ----------------------------------------------------
    console.log('1️⃣ TESTING BACKEND API & DATABASE INTEGRITY...');
    const health = await request(`${BACKEND_URL}/health`);
    assert(health.status === 200 && health.data?.status === 'ok', 'Backend Health Endpoint (GET /health)');

    // ----------------------------------------------------
    // SECTION 2: AUTHENTICATION & TOKEN LIFECYCLE
    // ----------------------------------------------------
    console.log('\n2️⃣ TESTING AUTHENTICATION & ROLE-BASED ACCESS...');

    // Admin Login
    const adminLoginData = JSON.stringify({ email: 'admin@attendx.com', password: 'Admin@123' });
    const adminRes = await request(`${BACKEND_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminLoginData) },
      body: adminLoginData,
    });
    assert(adminRes.status === 200 && adminRes.data?.data?.accessToken, 'Admin Login Authentication (POST /api/auth/admin/login)');
    const adminToken = adminRes.data?.data?.accessToken;

    // Admin Profile Verification
    const adminMe = await request(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminMe.status === 200 && adminMe.data?.data?.user?.role === 'admin', 'Admin Profile Identity (GET /api/auth/me)');

    // Employee Dev Google Login
    const employeeLoginRes = await request(`${BACKEND_URL}/api/auth/google/dev-select?email=vivaninteriors%40gmail.com&name=VIVAN`);
    const empRedirectLoc = employeeLoginRes.headers.location || '';
    const empTokenMatch = empRedirectLoc.match(/token=([^&]+)/);
    assert(employeeLoginRes.status === 302 && empTokenMatch, 'Google Dev OAuth Redirect (GET /api/auth/google/dev-select)');
    const employeeToken = empTokenMatch ? empTokenMatch[1] : null;

    // Employee Profile Verification
    const employeeMe = await request(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert(employeeMe.status === 200 && employeeMe.data?.data?.user?.role === 'employee', 'Employee Profile Identity (GET /api/auth/me)');

    // ----------------------------------------------------
    // SECTION 3: ATTENDANCE & PUNCH LIFECYCLE
    // ----------------------------------------------------
    console.log('\n3️⃣ TESTING ATTENDANCE PUNCH & TELEMETRY LIFECYCLE...');

    // Today Status Check
    const todayRes = await request(`${BACKEND_URL}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert(todayRes.status === 200 && todayRes.data?.success, 'Fetch Today Attendance Status (GET /api/attendance/today)');

    // Monthly Stats
    const statsRes = await request(`${BACKEND_URL}/api/attendance/stats`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert(statsRes.status === 200 && statsRes.data?.data?.stats, 'Fetch Monthly Attendance Stats (GET /api/attendance/stats)');

    // Attendance History Query
    const historyRes = await request(`${BACKEND_URL}/api/attendance/history?limit=10`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert(historyRes.status === 200 && Array.isArray(historyRes.data?.data?.records), 'Fetch Attendance Ledger (GET /api/attendance/history)');

    // ----------------------------------------------------
    // SECTION 4: ADMIN CONTROLS & SETTINGS
    // ----------------------------------------------------
    console.log('\n4️⃣ TESTING ADMIN MANAGEMENT CONTROLS...');

    const pendingRes = await request(`${BACKEND_URL}/api/admin/pending-employees`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(pendingRes.status === 200 && Array.isArray(pendingRes.data?.data?.employees), 'Fetch Pending Employees (GET /api/admin/pending-employees)');

    const rosterRes = await request(`${BACKEND_URL}/api/admin/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(rosterRes.status === 200 && Array.isArray(rosterRes.data?.data?.employees), 'Fetch Employee Roster (GET /api/admin/employees)');

    const settingsRes = await request(`${BACKEND_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(settingsRes.status === 200 && settingsRes.data?.data?.settings?.officeLatitude, 'Fetch Geofence Settings (GET /api/admin/settings)');

    const auditRes = await request(`${BACKEND_URL}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditRes.status === 200 && Array.isArray(auditRes.data?.data?.logs), 'Fetch System Audit Logs (GET /api/admin/audit-logs)');

    // ----------------------------------------------------
    // SECTION 5: USER-AGENT BACKEND ROUTING TEST
    // ----------------------------------------------------
    console.log('\n5️⃣ TESTING USER-AGENT BACKEND ROUTING...');

    const mobileUaRes = await request(`${BACKEND_URL}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
    });
    assert(mobileUaRes.status === 200 && mobileUaRes.raw.includes('AttendX Mobile'), 'User-Agent Mobile Routing (returns AttendX Mobile build)');

    const desktopUaRes = await request(`${BACKEND_URL}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    assert(desktopUaRes.status === 200 && desktopUaRes.raw.includes('AttendX'), 'User-Agent Desktop Routing (returns AttendX Desktop build)');

    // ----------------------------------------------------
    // SECTION 6: PUPPETEER UI RENDERING VERIFICATION
    // ----------------------------------------------------
    console.log('\n6️⃣ TESTING PUPPETEER REAL BROWSER UI RENDERING...');

    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Test Desktop Page Render
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });
    await desktopPage.goto(`${DESKTOP_URL}/login`, { waitUntil: 'networkidle2' });
    const desktopTitle = await desktopPage.title();
    assert(desktopTitle.length > 0, `Desktop Login Render (${DESKTOP_URL}/login)`);

    // Test Mobile Page Render
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await mobilePage.goto(`${MOBILE_URL}/login`, { waitUntil: 'networkidle2' });
    const mobileTitle = await mobilePage.title();
    assert(mobileTitle.includes('AttendX Mobile'), `Mobile Login Render (${MOBILE_URL}/login)`);

    await browser.close();

    console.log('\n====================================================');
    console.log(`📊 FULL SCALE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Error during full-scale testing:', err);
    process.exit(1);
  }
}

runFullScaleTest();
