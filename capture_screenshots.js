const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5005';

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getAdminToken() {
  const data = JSON.stringify({ email: 'admin@attendx.com', password: 'Admin@123' });
  const res = await fetchJson(`${BACKEND_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
    body: data,
  });
  return res.data.accessToken;
}

async function getEmployeeToken(email, name) {
  return new Promise((resolve, reject) => {
    http.get(`${BACKEND_URL}/api/auth/google/dev-select?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`, (res) => {
      const loc = res.headers.location;
      if (loc && loc.includes('token=')) {
        const token = new URL(loc).searchParams.get('token');
        resolve(token);
      } else {
        reject(new Error(`Failed to get token for ${email}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching auth tokens...');
  const adminToken = await getAdminToken();
  const vivanToken = await getEmployeeToken('vivaninteriors@gmail.com', 'VIVAN');
  const sarahToken = await getEmployeeToken('sarah.connor@attendx.com', 'Sarah Connor');
  const johnToken = await getEmployeeToken('john.doe@attendx.com', 'John Doe');

  console.log('Tokens acquired.');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  const takeScreenshot = async (name, delayMs = 1200) => {
    await new Promise((r) => setTimeout(r, delayMs));
    const filePath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[SAVED] ${name}.png`);
  };

  const setAuth = async (token) => {
    await page.evaluate((t) => {
      localStorage.setItem('access_token', t);
    }, token);
  };

  const clickByText = async (text) => {
    await page.evaluate((targetText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((b) => b.textContent && b.textContent.toLowerCase().includes(targetText.toLowerCase()));
      if (target) target.click();
    }, text);
  };

  try {
    // 1. Login Page - Employee Tab
    console.log('1. Capturing Login Page (Employee Sign In)...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot('01_login_page_employee');

    // 2. Login Page - Admin Tab
    console.log('2. Capturing Login Page (Admin Portal)...');
    await clickByText('Admin Portal');
    await takeScreenshot('02_login_page_admin');

    // 3. Google Account Picker
    console.log('3. Capturing Google Picker Page...');
    await page.goto(`${FRONTEND_URL}/google-picker`, { waitUntil: 'networkidle2' });
    await takeScreenshot('03_google_account_picker');

    // 4. Employee Dashboard (VIVAN)
    console.log('4. Capturing Employee Dashboard...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await setAuth(vivanToken);
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot('04_employee_dashboard');

    // 5. Employee History Page
    console.log('5. Capturing Attendance History Page...');
    await page.goto(`${FRONTEND_URL}/history`, { waitUntil: 'networkidle2' });
    await takeScreenshot('05_attendance_history');

    // 6. Onboarding Page (John Doe)
    console.log('6. Capturing Profile Onboarding Page...');
    await page.goto(`${FRONTEND_URL}/onboarding`, { waitUntil: 'networkidle2' });
    await setAuth(johnToken);
    await page.goto(`${FRONTEND_URL}/onboarding`, { waitUntil: 'networkidle2' });
    await takeScreenshot('06_profile_onboarding');

    // 7. Pending Approval Page (Sarah Connor)
    console.log('7. Capturing Pending Approval Page...');
    await page.goto(`${FRONTEND_URL}/pending-approval`, { waitUntil: 'networkidle2' });
    await setAuth(sarahToken);
    await page.goto(`${FRONTEND_URL}/pending-approval`, { waitUntil: 'networkidle2' });
    await takeScreenshot('07_pending_approval');

    // 8. Admin Dashboard - Approvals Tab
    console.log('8. Capturing Admin Dashboard (Pending Approvals)...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await setAuth(adminToken);
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot('08_admin_dashboard_approvals');

    // 9. Admin Dashboard - Employee Directory Tab
    console.log('9. Capturing Admin Dashboard (Employee Directory)...');
    await clickByText('Employee Directory');
    await takeScreenshot('09_admin_dashboard_directory');

    // 10. Admin Dashboard - Attendance Feed Tab
    console.log('10. Capturing Admin Dashboard (Attendance Feed)...');
    await clickByText('Attendance Feed');
    await takeScreenshot('10_admin_dashboard_attendance_feed');

    // 11. Admin Dashboard - Geofence Settings Tab
    console.log('11. Capturing Admin Dashboard (Geofence Settings)...');
    await clickByText('Geofence Settings');
    await takeScreenshot('11_admin_dashboard_geofence_settings');

    // 12. Admin Dashboard - Holidays Tab
    console.log('12. Capturing Admin Dashboard (Holidays)...');
    await clickByText('Holidays');
    await takeScreenshot('12_admin_dashboard_holidays');

    // 13. Reports & Analytics Page
    console.log('13. Capturing Reports & Analytics Page...');
    await page.goto(`${FRONTEND_URL}/reports`, { waitUntil: 'networkidle2' });
    await takeScreenshot('13_admin_reports_analytics');

    console.log('\n✅ ALL 13 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error taking screenshots:', err);
  } finally {
    await browser.close();
  }
}

run();
