const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runLoginTransitionTests() {
  console.log('⚡ Starting MyFinance Premium Login Transition Loader Verification Suite...\n');
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

  try {
    // 1. Static Component File Existence
    console.log('--- TEST 1: Component Files & Modules ---');
    const loaderPath = path.join(__dirname, '..', 'src', 'components', 'loaders', 'LoginTransitionLoader.tsx');
    const graphicsPath = path.join(__dirname, '..', 'src', 'components', 'loaders', 'LoginTransitionGraphics.tsx');
    const scssPath = path.join(__dirname, '..', 'src', 'styles', 'components', '_login-transition-loader.scss');

    assert(fs.existsSync(loaderPath), 'LoginTransitionLoader.tsx exists');
    assert(fs.existsSync(graphicsPath), 'LoginTransitionGraphics.tsx exists');
    assert(fs.existsSync(scssPath), '_login-transition-loader.scss exists');

    // 2. SCSS Structure and Dynamic Theme Variables
    console.log('\n--- TEST 2: Dynamic SCSS Architecture & Theme Tokens ---');
    const scssContent = fs.readFileSync(scssPath, 'utf-8');
    assert(scssContent.includes('--loader-primary: var(--color-primary,'), 'SCSS dynamically inherits --color-primary');
    assert(scssContent.includes('--loader-secondary: var(--color-secondary,'), 'SCSS dynamically inherits --color-secondary');
    assert(scssContent.includes('.login-loader {'), '.login-loader root class defined');
    assert(scssContent.includes('z-index: 999999;'), 'z-index is 999999 for full-screen supremacy');
    assert(scssContent.includes('position: fixed;'), 'Fixed position covers full viewport');
    assert(scssContent.includes('.login-loader-stage'), '3D Financial Universe stage container styled');
    assert(scssContent.includes('.login-loader-orbit-ring'), '3D Orbital rings styled');
    assert(scssContent.includes('.login-loader-tile'), 'Glassmorphic icon tiles styled');
    assert(scssContent.includes('.login-loader-progress-fill'), 'Futuristic progress bar styled');
    assert(scssContent.includes('.login-loader-milestone'), 'Multi-stage milestones styled');
    assert(scssContent.includes('.loader-finishing'), 'Finishing dissolve animation class defined');

    // 3. Login-Triggered Mechanism in AuthContext & Loader
    console.log('\n--- TEST 3: Login-Triggered Logic & Replay Prevention ---');
    const authContextPath = path.join(__dirname, '..', 'src', 'context', 'AuthContext.tsx');
    const authContent = fs.readFileSync(authContextPath, 'utf-8');
    assert(
      authContent.includes("sessionStorage.setItem('myfinance_login_transition', 'true')"),
      'AuthContext sets myfinance_login_transition flag on successful login/signup'
    );

    const loaderContent = fs.readFileSync(loaderPath, 'utf-8');
    assert(
      loaderContent.includes("sessionStorage.getItem('myfinance_login_transition')"),
      'LoginTransitionLoader checks myfinance_login_transition flag'
    );
    assert(
      loaderContent.includes("sessionStorage.removeItem('myfinance_login_transition')"),
      'LoginTransitionLoader immediately clears flag to prevent replay on refresh/navigation'
    );
    assert(
      loaderContent.includes('document.documentElement.style.overflow = \'hidden\''),
      'Scroll locking enabled while transition is active'
    );
    assert(
      loaderContent.includes('isReady'),
      'Loader accepts isReady prop tied to actual dashboard data readiness'
    );

    // 4. Dashboard Integration
    console.log('\n--- TEST 4: Dashboard Integration & Clean Slate ---');
    const dashboardPagePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
    const dashPageContent = fs.readFileSync(dashboardPagePath, 'utf-8');
    assert(
      dashPageContent.includes('<LoginTransitionLoader'),
      'Dashboard page mounts LoginTransitionLoader'
    );

    const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    assert(
      !layoutContent.includes('FirstVisitLoader'),
      'Layout is purged of old first-visit loader'
    );

    const mainScssPath = path.join(__dirname, '..', 'src', 'styles', 'main.scss');
    const mainScssContent = fs.readFileSync(mainScssPath, 'utf-8');
    assert(
      mainScssContent.includes("components/login-transition-loader"),
      'main.scss imports components/login-transition-loader'
    );
    assert(
      !mainScssContent.includes("first-visit-loader"),
      'main.scss no longer imports first-visit-loader'
    );

    // 5. Visual Hourglass & Hologram Graphic Elements
    console.log('\n--- TEST 5: SVG 3D Hourglass, Pedestal & Particle Landscape ---');
    const graphicsContent = fs.readFileSync(graphicsPath, 'utf-8');
    assert(
      graphicsContent.includes('FinancialVaultHourglassGraphic'),
      'FinancialVaultHourglassGraphic component exported'
    );
    assert(
      graphicsContent.includes('HologramPedestalGraphic'),
      'HologramPedestalGraphic component exported'
    );
    assert(
      graphicsContent.includes('ParticleMeshLandscape'),
      'ParticleMeshLandscape cybernetic floor component exported'
    );

    console.log(`\n========================================`);
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runLoginTransitionTests();
