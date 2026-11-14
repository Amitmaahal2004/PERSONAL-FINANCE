const fs = require('fs');
const path = require('path');

const CDP_PORT = 9225;
const BASE_URL = 'http://localhost:3000';
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
  console.log('🌟 Starting Live Browser CDP Verification for MyFinance Hero Carousel...\n');
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
    // 1. Create a fresh tab pointing to landing page
    const newTabRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${BASE_URL}/`, {
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

    // Set desktop viewport to 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('--- STEP 1: Verify Landing Page & Hero Carousel Mount ---');
    await sleep(2000);

    const checkHero = await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-carousel-section") !== null',
      returnByValue: true,
    });
    assert(checkHero.result.value === true, 'HeroCarousel component (.hero-carousel-section) rendered on landing page');

    // 2. Slide 1 Inspection
    console.log('\n--- STEP 2: Verify Slide 1 (Take Control of Your Money) ---');
    const slide1Data = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const activePane = document.querySelector('.hero-slide-pane.active');
        const badge = activePane?.querySelector('.hero-carousel-badge')?.textContent;
        const title = activePane?.querySelector('.hero-carousel-title')?.textContent;
        const features = Array.from(activePane?.querySelectorAll('.feature-label') || []).map(el => el.textContent);
        const hasLaptop = document.querySelector('.hero-carousel-laptop') !== null;
        const hasMobile = document.querySelector('.hero-carousel-mobile') !== null;
        const floatCards = document.querySelectorAll('.hero-carousel-float-card').length;

        return { badge, title, features, hasLaptop, hasMobile, floatCards };
      })()`,
      returnByValue: true,
    });

    const s1 = slide1Data.result.value;
    assert(s1?.badge?.includes('Your Personal Finance CRM'), `Slide 1 badge matches "Your Personal Finance CRM" (got "${s1?.badge}")`);
    assert(s1?.title?.includes('Take Control of Your Money.'), `Slide 1 title matches "Take Control of Your Money." (got "${s1?.title}")`);
    assert(s1?.features?.length === 4, `Slide 1 has 4 feature highlights (got ${s1?.features?.length})`);
    assert(s1?.hasLaptop, 'Laptop mockup rendered on desktop');
    assert(s1?.hasMobile, 'Mobile phone mockup rendered on desktop');
    assert(s1?.floatCards >= 2, `Floating glassmorphic badges rendered (got ${s1?.floatCards})`);

    // Capture screenshot of Slide 1
    const s1Screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero-carousel-slide1.png'), Buffer.from(s1Screenshot.data, 'base64'));
    console.log('  📸 Captured screenshot: hero-carousel-slide1.png');

    // 3. Navigate to Slide 2
    console.log('\n--- STEP 3: Navigate to Slide 2 (Know Where Every Rupee Goes) ---');
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-carousel-arrow.next")?.click()',
    });
    await sleep(800);

    const slide2Data = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const activePane = document.querySelector('.hero-slide-pane.active');
        const badge = activePane?.querySelector('.hero-carousel-badge')?.textContent;
        const title = activePane?.querySelector('.hero-carousel-title')?.textContent;
        const hasUdhaarMock = document.querySelector('.laptop-slide-udhaar') !== null;
        return { badge, title, hasUdhaarMock };
      })()`,
      returnByValue: true,
    });

    const s2 = slide2Data.result.value;
    assert(s2?.badge?.includes('Complete Financial Management'), `Slide 2 badge matches "Complete Financial Management" (got "${s2?.badge}")`);
    assert(s2?.title?.includes('Know Where Every Rupee Goes.'), `Slide 2 title matches "Know Where Every Rupee Goes." (got "${s2?.title}")`);
    assert(s2?.hasUdhaarMock, 'Udhaar module mock rendered on Slide 2 laptop display');

    // Capture screenshot of Slide 2
    const s2Screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero-carousel-slide2.png'), Buffer.from(s2Screenshot.data, 'base64'));
    console.log('  📸 Captured screenshot: hero-carousel-slide2.png');

    // 4. Navigate to Slide 3
    console.log('\n--- STEP 4: Navigate to Slide 3 (Make Your Money Work Smarter) ---');
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-carousel-arrow.next")?.click()',
    });
    await sleep(800);

    const slide3Data = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const activePane = document.querySelector('.hero-slide-pane.active');
        const badge = activePane?.querySelector('.hero-carousel-badge')?.textContent;
        const title = activePane?.querySelector('.hero-carousel-title')?.textContent;
        const hasBudgetMock = document.querySelector('.laptop-slide-budgets') !== null;
        return { badge, title, hasBudgetMock };
      })()`,
      returnByValue: true,
    });

    const s3 = slide3Data.result.value;
    assert(s3?.badge?.includes('Plan. Save. Grow.'), `Slide 3 badge matches "Plan. Save. Grow." (got "${s3?.badge}")`);
    assert(s3?.title?.includes('Make Your Money Work Smarter.'), `Slide 3 title matches "Make Your Money Work Smarter." (got "${s3?.title}")`);
    assert(s3?.hasBudgetMock, 'Budgets & Goals mock rendered on Slide 3 laptop display');

    // Capture screenshot of Slide 3
    const s3Screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero-carousel-slide3.png'), Buffer.from(s3Screenshot.data, 'base64'));
    console.log('  📸 Captured screenshot: hero-carousel-slide3.png');

    // 5. Test "Watch Demo" Interactive Modal
    console.log('\n--- STEP 5: Test "Watch Demo" Interactive Modal ---');
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-carousel-btn-secondary")?.click()',
    });
    await sleep(500);

    const modalCheck = await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-demo-modal") !== null',
      returnByValue: true,
    });
    assert(modalCheck.result.value === true, 'Interactive Demo Modal opens when clicking "Watch Demo"');

    // Switch to Udhaar tab
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelectorAll(".hero-demo-tab")[1]?.click()',
    });
    await sleep(300);

    const demoScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero-carousel-demo-modal.png'), Buffer.from(demoScreenshot.data, 'base64'));
    console.log('  📸 Captured screenshot: hero-carousel-demo-modal.png');

    // Close modal
    await cdp.send('Runtime.evaluate', {
      expression: 'document.querySelector(".hero-demo-modal-close")?.click()',
    });
    await sleep(400);

    // 6. Test Responsive Mobile Viewport (390x844)
    console.log('\n--- STEP 6: Test Responsive Mobile Viewport (390x844) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);

    const mobileCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const carousel = document.querySelector('.hero-carousel-section');
        const title = document.querySelector('.hero-carousel-title');
        const cta = document.querySelector('.hero-carousel-btn-primary');
        return {
          hasCarousel: !!carousel,
          hasTitle: !!title,
          titleFontSize: window.getComputedStyle(title).fontSize,
          hasCta: !!cta,
        };
      })()`,
      returnByValue: true,
    });

    assert(mobileCheck.result.value?.hasCarousel, 'Carousel renders cleanly on mobile');
    assert(mobileCheck.result.value?.hasTitle, 'Headline renders on mobile');
    assert(mobileCheck.result.value?.hasCta, 'Primary CTA renders on mobile');

    const mobileScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero-carousel-mobile-view.png'), Buffer.from(mobileScreenshot.data, 'base64'));
    console.log('  📸 Captured screenshot: hero-carousel-mobile-view.png');

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

