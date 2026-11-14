const fs = require('fs');
const path = require('path');

async function runHeroCarouselTests() {
  console.log('🎠 Starting MyFinance Hero Carousel Verification Suite...\n');
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
    // 1. Files existence
    console.log('--- TEST 1: Component Files & SCSS Architecture ---');
    const carouselPath = path.join(__dirname, '..', 'src', 'components', 'home', 'HeroCarousel.tsx');
    const slidePath = path.join(__dirname, '..', 'src', 'components', 'home', 'HeroSlide.tsx');
    const visualPath = path.join(__dirname, '..', 'src', 'components', 'home', 'HeroVisual.tsx');
    const demoPath = path.join(__dirname, '..', 'src', 'components', 'home', 'DemoModal.tsx');
    const scssPath = path.join(__dirname, '..', 'src', 'styles', 'components', '_hero-carousel.scss');

    assert(fs.existsSync(carouselPath), 'HeroCarousel.tsx exists');
    assert(fs.existsSync(slidePath), 'HeroSlide.tsx exists');
    assert(fs.existsSync(visualPath), 'HeroVisual.tsx exists');
    assert(fs.existsSync(demoPath), 'DemoModal.tsx exists');
    assert(fs.existsSync(scssPath), '_hero-carousel.scss exists');

    // 2. Slide Data Definitions
    console.log('\n--- TEST 2: 3 Carousel Slides & Required Copy ---');
    const slideCode = fs.readFileSync(slidePath, 'utf-8');

    // Slide 1
    assert(slideCode.includes('Your Personal Finance CRM'), 'Slide 1 badge matches "Your Personal Finance CRM"');
    assert(slideCode.includes('Take Control of ') && slideCode.includes('Your Money.'), 'Slide 1 headline matches "Take Control of Your Money."');
    assert(slideCode.includes('Track Transactions'), 'Slide 1 feature: Track Transactions');
    assert(slideCode.includes('Manage Accounts'), 'Slide 1 feature: Manage Accounts');
    assert(slideCode.includes('Set Savings Goals'), 'Slide 1 feature: Set Savings Goals');
    assert(slideCode.includes('Detailed Reports'), 'Slide 1 feature: Detailed Reports');

    // Slide 2
    assert(slideCode.includes('Complete Financial Management'), 'Slide 2 badge matches "Complete Financial Management"');
    assert(slideCode.includes('Know Where Every ') && slideCode.includes('Rupee Goes.'), 'Slide 2 headline matches "Know Where Every Rupee Goes."');
    assert(slideCode.includes('Income & Expense Tracking'), 'Slide 2 feature: Income & Expense Tracking');
    assert(slideCode.includes('Multiple Accounts'), 'Slide 2 feature: Multiple Accounts');
    assert(slideCode.includes('Udhaar Management'), 'Slide 2 feature: Udhaar Management');
    assert(slideCode.includes('Loans & Borrowing'), 'Slide 2 feature: Loans & Borrowing');

    // Slide 3
    assert(slideCode.includes('Plan. Save. Grow.'), 'Slide 3 badge matches "Plan. Save. Grow."');
    assert(slideCode.includes('Make Your Money ') && slideCode.includes('Work Smarter.'), 'Slide 3 headline matches "Make Your Money Work Smarter."');
    assert(slideCode.includes('Smart Budgets'), 'Slide 3 feature: Smart Budgets');
    assert(slideCode.includes('Recurring Payments'), 'Slide 3 feature: Recurring Payments');

    // CTAs
    assert(slideCode.includes('Start Free Personal Account'), 'Primary CTA matches "Start Free Personal Account"');
    assert(slideCode.includes('Watch Demo'), 'Secondary CTA matches "Watch Demo"');

    // 3. Carousel Functionality & Controls
    console.log('\n--- TEST 3: Carousel Interactivity & Handlers ---');
    const carouselCode = fs.readFileSync(carouselPath, 'utf-8');
    assert(carouselCode.includes('AUTOPLAY_INTERVAL'), 'Autoplay timer interval configured');
    assert(carouselCode.includes('onMouseEnter') && carouselCode.includes('onMouseLeave'), 'Pause autoplay on hover implemented');
    assert(carouselCode.includes('onTouchStart') && carouselCode.includes('onTouchEnd'), 'Mobile touch/swipe navigation implemented');
    assert(carouselCode.includes('onKeyDown') && carouselCode.includes('ArrowLeft'), 'Keyboard left/right navigation implemented');
    assert(carouselCode.includes('hero-carousel-arrow prev') && carouselCode.includes('hero-carousel-arrow next'), 'Manual previous and next arrow buttons implemented');
    assert(carouselCode.includes('hero-carousel-dots'), 'Pagination indicators / tabs implemented');
    assert(carouselCode.includes('DemoModal'), 'Interactive DemoModal hooked to Watch Demo CTA');

    // 4. Visual Mockups (Laptop + Mobile + Badges)
    console.log('\n--- TEST 4: Visual Device Mockups & Floating Badges ---');
    const visualCode = fs.readFileSync(visualPath, 'utf-8');
    assert(visualCode.includes('hero-carousel-laptop'), 'Realistic laptop frame implemented');
    assert(visualCode.includes('laptop-camera-notch'), 'MacBook camera notch rendered');
    assert(visualCode.includes('laptop-screen-glare'), 'Glossy screen reflection layer rendered');
    assert(visualCode.includes('hero-carousel-mobile'), 'Sleek iPhone 15 Pro mobile mockup implemented');
    assert(visualCode.includes('mobile-dynamic-island'), 'Dynamic island pill rendered on mobile phone');
    assert(visualCode.includes('hero-carousel-float-card'), 'Floating glassmorphic financial badges implemented');

    // 5. Landing Page Integration & Navbar Preservation
    console.log('\n--- TEST 5: Landing Page Integration & Navbar Links Preservation ---');
    const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
    const pageCode = fs.readFileSync(pagePath, 'utf-8');
    assert(pageCode.includes('<HeroCarousel />') || pageCode.includes('<HeroCarousel/>'), 'HeroCarousel mounted in page.tsx');
    assert(pageCode.includes('href="#features"'), 'Navbar #features link preserved');
    assert(pageCode.includes('href="#how-it-works"'), 'Navbar #how-it-works link preserved');
    assert(pageCode.includes('href="#security"'), 'Navbar #security link preserved');
    assert(pageCode.includes('href="#faq"'), 'Navbar #faq link preserved');
    assert(pageCode.includes('href="/login"'), 'Navbar /login link preserved');
    assert(pageCode.includes('href="/signup"'), 'Navbar /signup link preserved');

    // 6. SCSS Styling & Token Rules
    console.log('\n--- TEST 6: SCSS Architecture & Design Tokens ---');
    const scssCode = fs.readFileSync(scssPath, 'utf-8');
    assert(scssCode.includes('.hero-carousel-section'), '.hero-carousel-section root styling defined');
    assert(scssCode.includes('.hero-carousel-laptop'), 'Laptop styling defined');
    assert(scssCode.includes('.hero-carousel-mobile'), 'Mobile styling defined');
    assert(scssCode.includes('.hero-demo-modal'), 'Demo modal styling defined');
    assert(scssCode.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion accessibility handled');

    const mainScssPath = path.join(__dirname, '..', 'src', 'styles', 'main.scss');
    const mainScssCode = fs.readFileSync(mainScssPath, 'utf-8');
    assert(mainScssCode.includes("components/hero-carousel"), 'main.scss imports components/hero-carousel');

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

runHeroCarouselTests();

