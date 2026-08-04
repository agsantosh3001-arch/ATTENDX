const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, 'mobile_screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MOBILE_URL = 'http://localhost:5174';
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
  console.log('Fetching auth tokens for mobile screenshots...');
  const adminToken = await getAdminToken();
  const vivanToken = await getEmployeeToken('vivaninteriors@gmail.com', 'VIVAN');
  const sarahToken = await getEmployeeToken('sarah.connor@attendx.com', 'Sarah Connor');
  const johnToken = await getEmployeeToken('john.doe@attendx.com', 'John Doe');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  });

  const page = await browser.newPage();

  const takeScreenshot = async (name, delayMs = 1200) => {
    await new Promise((r) => setTimeout(r, delayMs));
    const filePath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[SAVED MOBILE SCREENSHOT] ${name}.png`);
  };

  const setAuth = async (token) => {
    await page.evaluate((t) => {
      localStorage.setItem('access_token', t);
    }, token);
  };

  try {
    // 1. Mobile Login Page
    console.log('1. Capturing Mobile Login Page...');
    await page.goto(`${MOBILE_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot('01_mobile_login');

    // 2. Mobile Employee Dashboard (VIVAN)
    console.log('2. Capturing Mobile Employee Dashboard...');
    await page.goto(`${MOBILE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await setAuth(vivanToken);
    await page.goto(`${MOBILE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot('02_mobile_employee_dashboard');

    // 3. Mobile History Page
    console.log('3. Capturing Mobile Attendance History Page...');
    await page.goto(`${MOBILE_URL}/history`, { waitUntil: 'networkidle2' });
    await takeScreenshot('03_mobile_attendance_history');

    // 4. Mobile Profile Page
    console.log('4. Capturing Mobile Profile Page...');
    await page.goto(`${MOBILE_URL}/profile`, { waitUntil: 'networkidle2' });
    await takeScreenshot('04_mobile_profile');

    // 5. Mobile Profile Onboarding Page (John Doe)
    console.log('5. Capturing Mobile Onboarding Page...');
    await page.goto(`${MOBILE_URL}/onboarding`, { waitUntil: 'networkidle2' });
    await setAuth(johnToken);
    await page.goto(`${MOBILE_URL}/onboarding`, { waitUntil: 'networkidle2' });
    await takeScreenshot('05_mobile_onboarding');

    // 6. Mobile Pending Approval Page (Sarah Connor)
    console.log('6. Capturing Mobile Pending Approval Page...');
    await page.goto(`${MOBILE_URL}/pending-approval`, { waitUntil: 'networkidle2' });
    await setAuth(sarahToken);
    await page.goto(`${MOBILE_URL}/pending-approval`, { waitUntil: 'networkidle2' });
    await takeScreenshot('06_mobile_pending_approval');

    // 7. Mobile Admin Dashboard
    console.log('7. Capturing Mobile Admin Dashboard...');
    await page.goto(`${MOBILE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await setAuth(adminToken);
    await page.goto(`${MOBILE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot('07_mobile_admin_dashboard');

    // 8. Mobile Admin Employees Page
    console.log('8. Capturing Mobile Admin Employees Page...');
    await page.goto(`${MOBILE_URL}/admin/employees`, { waitUntil: 'networkidle2' });
    await takeScreenshot('08_mobile_admin_employees');

    // 9. Mobile Admin Attendance Page
    console.log('9. Capturing Mobile Admin Attendance Page...');
    await page.goto(`${MOBILE_URL}/admin/attendance`, { waitUntil: 'networkidle2' });
    await takeScreenshot('09_mobile_admin_attendance');

    console.log('\n✅ ALL MOBILE SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error capturing mobile screenshots:', err);
  } finally {
    await browser.close();
  }
}

run();
