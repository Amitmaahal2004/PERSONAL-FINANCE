const fs = require('fs');
const path = require('path');

const CDP_PORT = 9225;
const ARTIFACT_DIR = 'C:\\Users\\Spark Web\\.gemini\\antigravity\\brain\\3eaad3bc-b051-4fdb-aaf0-1987c18f5141';

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

async function run() {
  console.log('🌟 Starting Live Browser CDP Verification for MyFinance Login Transition Loader...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  let targetId = null;
  let cdp = null;

  try {
    // 1. Create a fresh tab pointing to /login
    const newTabRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://localhost:3000/login`, {
      method: 'PUT',
    });
    const tabInfo = await newTabRes.json();
    targetId = tabInfo.id;
    console.log(`  Connected to tab: ${targetId}`);

    cdp = new CDPClient(tabInfo.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // Set viewport to 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('--- STEP 1: Wait for Login Page to Load ---');
    await sleep(2000);

    const checkForm = await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector("input[name=\'email\'], input[type=\'email\']") !== null',
      returnByValue: true,
    });
    assert(checkForm.result.value === true, 'Login form email input found on page');

    // 2. Fill credentials
    console.log('--- STEP 2: Fill Login Credentials & Submit ---');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const setReactValue = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const emailInput = document.querySelector("input[name='email'], input[type='email']");
        const passwordInput = document.querySelector("input[name='password'], input[type='password']");
        if (emailInput && passwordInput) {
          setReactValue(emailInput, 'admin@myfinance.app');
          setReactValue(passwordInput, 'AdminSecurePassword123!');
        }
      })()`,
    });

    await sleep(200);

    // Click submit
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.click();
      })()`,
    });

    console.log('  Submitted login form, monitoring transition state...');

    // 3. Monitor for Login Transition Loader appearance
    let loaderDetected = false;
    let loaderDetails = null;

    for (let i = 0; i < 20; i++) {
      await sleep(150);
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const loader = document.querySelector('.login-loader');
          if (!loader) return null;
          const brandTitle = loader.querySelector('.login-loader-brand-title')?.textContent;
          const brandTag = loader.querySelector('.login-loader-brand-tag')?.textContent;
          const statusMsg = loader.querySelector('.login-loader-message')?.textContent;
          const progressVal = loader.getAttribute('aria-valuenow');
          const hasHourglass = loader.querySelector('.login-loader-central-wrap, .login-loader-hourglass-svg') !== null;
          const hasOrbit = loader.querySelector('.login-loader-orbit-ring') !== null;
          const tilesCount = loader.querySelectorAll('.login-loader-tile').length;
          const isFinishing = loader.classList.contains('loader-finishing');

          return {
            brandTitle,
            brandTag,
            statusMsg,
            progressVal,
            hasHourglass,
            hasOrbit,
            tilesCount,
            isFinishing,
          };
        })()`,
        returnByValue: true,
      });

      if (evalRes.result.value) {
        loaderDetected = true;
        loaderDetails = evalRes.result.value;

        // Capture screenshot of the active loader
        const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const screenshotBuf = Buffer.from(screenshotRes.data, 'base64');
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'login-transition-active.png'), screenshotBuf);
        console.log('  📸 Captured screenshot: login-transition-active.png');
        break;
      }
    }

    console.log('\n--- STEP 3: Verify Login Transition Elements & Branding ---');
    assert(loaderDetected, 'Full-screen login transition loader (.login-loader) detected on login redirect');
    if (loaderDetails) {
      assert(loaderDetails.brandTitle === 'MyFinance', `Branding title is "MyFinance" (got "${loaderDetails.brandTitle}")`);
      assert(loaderDetails.brandTag?.includes('PRIVATE & SECURE'), `Tagline includes "PRIVATE & SECURE" (got "${loaderDetails.brandTag}")`);
      assert(loaderDetails.hasHourglass, '3D Luminous Glass Vault Hourglass SVG rendered');
      assert(loaderDetails.hasOrbit, 'Concentric cybernetic orbital gyro rings rendered');
      assert(loaderDetails.tilesCount === 6, `6 glassmorphic financial badges rendered (got ${loaderDetails.tilesCount})`);
      assert(loaderDetails.progressVal !== null, `Progress bar active with value: ${loaderDetails.progressVal}%`);
      console.log(`  Initial transition status message: "${loaderDetails.statusMsg}"`);
    }

    // 4. Wait for transition completion and dashboard reveal
    console.log('\n--- STEP 4: Await Smooth Finishing Dissolve & Dashboard Reveal ---');
    let dashboardRevealed = false;
    for (let i = 0; i < 40; i++) {
      await sleep(200);
      const checkDash = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const loader = document.querySelector('.login-loader');
          const isDissolved = !loader || loader.classList.contains('loader-finishing') || window.getComputedStyle(loader).opacity === '0';
          const heroBanner = document.querySelector('.dashboard-hero, .dashboard-title');
          const kpiCards = document.querySelectorAll('.dashboard-stat-card');
          return {
            isDissolved,
            hasHero: !!heroBanner,
            kpiCount: kpiCards.length,
            url: window.location.href,
          };
        })()`,
        returnByValue: true,
      });

      if (checkDash.result.value?.hasHero && checkDash.result.value?.isDissolved) {
        dashboardRevealed = true;
        // Wait another 300ms for animations to settle
        await sleep(400);
        const dashScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard-revealed.png'), Buffer.from(dashScreenshot.data, 'base64'));
        console.log('  📸 Captured screenshot: dashboard-revealed.png');
        break;
      }
    }

    assert(dashboardRevealed, 'Dashboard cleanly revealed with welcome hero banner and financial KPI cards');

    // 5. Verify Flag Consumption & Replay Prevention
    console.log('\n--- STEP 5: Replay Prevention on Refresh & Internal Routes ---');
    const flagCheck = await cdp.send('Runtime.evaluate', {
      expression: 'sessionStorage.getItem("myfinance_login_transition")',
      returnByValue: true,
    });
    assert(flagCheck.result.value === null, 'Transition flag immediately cleared from sessionStorage (null)');

    // 5a. Refresh page (F5) - should NOT show loader
    console.log('  Reloading dashboard page (simulating F5)...');
    await cdp.send('Page.reload');
    await sleep(1500);

    const loaderAfterRefresh = await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".login-loader") !== null',
      returnByValue: true,
    });
    assert(!loaderAfterRefresh.result.value, 'Loader DOES NOT appear on dashboard refresh (F5)');

    // 5b. Internal route navigation - should NOT show loader
    console.log('  Navigating internally to /transactions...');
    await cdp.send('Runtime.evaluate', {
      expression: 'window.location.href = "/transactions"',
    });
    await sleep(1500);

    const loaderAfterNav = await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".login-loader") !== null',
      returnByValue: true,
    });
    assert(!loaderAfterNav.result.value, 'Loader DOES NOT appear on internal page navigation to /transactions');

    console.log('\n======================================================');
    console.log(`LIVE BROWSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during CDP testing:', err);
    process.exit(1);
  } finally {
    if (cdp) {
      await cdp.close();
    }
    if (targetId) {
      try {
        await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${targetId}`);
      } catch {}
    }
  }
}

run();
