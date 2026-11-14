const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CDP_PORT = 9226;
const BASE_URL = 'http://localhost:3000';
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            cb.resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function main() {
  console.log('📸 Generating Authentic High-Res UI Mockup Screenshots for Hero Carousel...\n');
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // 1. Authenticate to get session cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@myfinance.app',
      password: 'AdminSecurePassword123!',
    }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  let token = '';
  if (cookieHeader) {
    const match = cookieHeader.match(/myfinance_token=([^;]+)/);
    if (match) token = match[1];
  }
  console.log('  Obtained auth session token.');

  // 2. Spawn headless Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${process.env.TEMP}\\chrome_screens_${Date.now()}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ]);

  await sleep(1500);

  try {
    // Helper to capture a page
    async function capture(urlPath, filename, width, height, isMobile = false) {
      console.log(`  Capturing ${urlPath} (${width}x${height}) -> ${filename}...`);
      const tabRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${BASE_URL}${urlPath}`, {
        method: 'PUT',
      });
      const tab = await tabRes.json();
      const cdp = new CDPClient(tab.webSocketDebuggerUrl);
      await cdp.connect();

      await cdp.send('Page.enable');
      await cdp.send('Network.enable');

      // Inject auth cookie
      if (token) {
        await cdp.send('Network.setCookie', {
          name: 'myfinance_token',
          value: token,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
        });
      }

      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2, // Retina 2x for sharp visuals
        mobile: isMobile,
      });

      await cdp.send('Page.navigate', { url: `${BASE_URL}${urlPath}` });
      await sleep(2500); // Wait for animations & charts to render

      const ss = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width,
          height,
          scale: 1,
        },
      });

      fs.writeFileSync(path.join(IMAGES_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`  ✅ Saved ${filename}`);

      await cdp.close();
      try {
        await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${tab.id}`);
      } catch {}
    }

    // 1. Dashboard Desktop (Slide 1)
    await capture('/dashboard', 'slide1-dashboard-desktop.png', 1320, 825, false);

    // 2. Dashboard Mobile (Slide 1 & Slide 2 Phone mockup)
    await capture('/dashboard', 'slide1-dashboard-mobile.png', 390, 844, true);

    // 3. Udhaar Desktop (Slide 2)
    await capture('/udhaar', 'slide2-udhaar-desktop.png', 1320, 825, false);

    // 4. Budgets Desktop (Slide 3)
    await capture('/budgets', 'slide3-budgets-desktop.png', 1320, 825, false);

    console.log('\n🎉 All slide screenshots generated successfully!');
  } catch (err) {
    console.error('Error generating screenshots:', err);
  } finally {
    chromeProc.kill('SIGTERM');
  }
}

main();

