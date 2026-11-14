const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runDashboardUITests() {
  console.log('🎨 Starting MyFinance Dashboard Redesign Validation Suite...\n');
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
    // 1. Admin Authentication
    console.log('--- TEST 1: Admin Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@myfinance.app',
        password: 'AdminSecurePassword123!',
      }),
    });
    assert(loginRes.status === 200, 'Admin login HTTP 200');
    const cookie = loginRes.headers.get('set-cookie');
    assert(cookie && cookie.includes('myfinance_token'), 'Session cookie issued');

    // 2. Fetch Dashboard HTML
    console.log('\n--- TEST 2: Dashboard Layout & SSR Verification ---');
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: cookie },
    });
    assert(dashRes.status === 200, 'Dashboard page responds with HTTP 200');
    const html = await dashRes.text();

    // 3. Deep Fintech Sidebar Verification (SSR)
    console.log('\n--- TEST 3: Deep Dark Green Sidebar UI Structure ---');
    assert(html.includes('sidebar'), 'Sidebar container present');
    assert(html.includes('MyFinance'), 'Sidebar brand MyFinance present');
    assert(html.includes('PRIVATE &amp; SECURE') || html.includes('PRIVATE & SECURE'), 'PRIVATE & SECURE brand tag present');
    assert(html.includes('sidebar-section-title') && html.includes('SETTINGS'), 'Settings section divider present');
    assert(html.includes('sidebar-promo'), 'Decorative promo card present in sidebar');
    assert(html.includes('Keep Your Finances Organized &amp; Secure') || html.includes('Keep Your Finances Organized & Secure'), 'Promo card text present');
    assert(html.includes('sidebar-user'), 'User profile card at bottom of sidebar present');
    assert(html.includes('sidebar-user-name'), 'User name container present');

    // 4. Header UI Verification (SSR)
    console.log('\n--- TEST 4: Premium Top Header Verification ---');
    assert(html.includes('header-search-btn'), 'Global search button present in header');
    assert(html.includes('Ctrl K') || html.includes('Ctrl'), 'Keyboard shortcut indicator present');
    assert(html.includes('header-currency'), 'Currency selector present in header');
    assert(html.includes('header-notification-btn'), 'Notification bell button present');
    assert(html.includes('header-notification-dot'), 'Notification unread indicator dot present');
    assert(html.includes('header-profile-avatar'), 'Header profile avatar circle present');

    // 5. Inspect Dashboard Page Component Source
    console.log('\n--- TEST 5: Dashboard Page Component Source Code Structure ---');
    const pageSource = fs.readFileSync(path.join(__dirname, '../src/app/dashboard/page.tsx'), 'utf-8');
    const scssSource = fs.readFileSync(path.join(__dirname, '../src/styles/pages/_dashboard.scss'), 'utf-8');

    // Welcome Hero & Quick Action Cards
    assert(pageSource.includes('dashboard-hero'), 'Welcome hero banner container present');
    assert(pageSource.includes('Good day,'), 'Welcome heading "Good day, [User]!" present');
    assert(pageSource.includes('100% private'), '100% private records subtitle present');
    assert(pageSource.includes('HeroFintechIllustration'), '3D Fintech vector illustration imported & used');
    assert(pageSource.includes('dashboard-quick-actions'), 'Quick actions container present');
    assert(pageSource.includes('New Transaction'), 'Quick action: "New Transaction" present');
    assert(pageSource.includes('Transfer Money'), 'Quick action: "Transfer Money" present');
    assert(pageSource.includes('View Reports'), 'Quick action: "View Reports" present');

    // 6. 8 Financial Summary KPI Cards
    console.log('\n--- TEST 6: 8 Financial Summary KPI Cards ---');
    assert(pageSource.includes('Available Balance'), 'KPI Card 1: Available Balance present');
    assert(pageSource.includes('Monthly Income'), 'KPI Card 2: Monthly Income present');
    assert(pageSource.includes('Monthly Expenses'), 'KPI Card 3: Monthly Expenses present');
    assert(pageSource.includes('Total Savings'), 'KPI Card 4: Total Savings present');
    assert(pageSource.includes('Total Income (All-Time)'), 'KPI Card 5: Total Income (All-Time) present');
    assert(pageSource.includes('Total Expenses (All-Time)'), 'KPI Card 6: Total Expenses (All-Time) present');
    assert(pageSource.includes('Outstanding Money'), 'KPI Card 7: Outstanding Money present');
    assert(pageSource.includes('To Receive:') && pageSource.includes('To Repay:'), 'Outstanding split: To Receive and To Repay present');
    assert(pageSource.includes('Budget Remaining'), 'KPI Card 8: Budget Remaining present');

    // 7. Charts & Visualizations
    console.log('\n--- TEST 7: Charts & Visualizations Structure ---');
    assert(pageSource.includes('dashboard-charts-row'), 'Charts row container present');
    assert(pageSource.includes('Income vs Expense Trend'), 'Income vs Expense Trend chart present');
    assert(pageSource.includes('Expenses by Category'), 'Expenses by Category donut chart present');
    assert(pageSource.includes('dashboard-donut-center'), 'Donut center total amount container present');

    // 8. Transactions & Mini Cards
    console.log('\n--- TEST 8: Recent Transactions & Stacked Mini Cards ---');
    assert(pageSource.includes('dashboard-transactions-card'), 'Recent Transactions card present');
    assert(pageSource.includes('Recent Transactions'), 'Recent Transactions title present');
    assert(pageSource.includes('Upcoming Payments'), 'Upcoming Payments mini card present');
    assert(pageSource.includes('Savings Goals'), 'Savings Goals mini card present');

    // 9. Right Aside Column (Glance, Insights & Goals)
    console.log('\n--- TEST 9: Right Sidebar Column Widgets ---');
    assert(pageSource.includes('dashboard-sidebar-column'), 'Right aside column present');
    assert(pageSource.includes('This Month at a Glance'), 'This Month at a Glance widget present');
    assert(pageSource.includes('Net Flow'), 'Net Flow row in Glance widget present');
    assert(pageSource.includes('Quick Insights'), 'Quick Insights widget present');
    assert(pageSource.includes('Goals Progress'), 'Goals Progress widget present');
    assert(pageSource.includes('GoalsTargetIllustration'), 'Goals dartboard/target illustration present');
    assert(pageSource.includes('Create Goal'), '"Create Goal" CTA button present');

    // 10. SCSS Fintech Design Tokens & Styling
    console.log('\n--- TEST 10: SCSS Fintech Design Tokens & Rules ---');
    assert(scssSource.includes('.dashboard-hero'), '.dashboard-hero SCSS rules present');
    assert(scssSource.includes('.dashboard-quick-actions'), '.dashboard-quick-actions SCSS rules present');
    assert(scssSource.includes('.dashboard-stats'), '.dashboard-stats 8-card grid SCSS rules present');
    assert(scssSource.includes('.dashboard-charts-row'), '.dashboard-charts-row SCSS rules present');
    assert(scssSource.includes('.dashboard-donut-center'), '.dashboard-donut-center SCSS rules present');
    assert(scssSource.includes('.dashboard-transactions-card'), '.dashboard-transactions-card SCSS rules present');
    assert(scssSource.includes('.dashboard-sidebar-column'), '.dashboard-sidebar-column SCSS rules present');
    assert(scssSource.includes('.dashboard-glance-list'), '.dashboard-glance-list SCSS rules present');
    assert(scssSource.includes('.dashboard-insights-list'), '.dashboard-insights-list SCSS rules present');
    assert(scssSource.includes('.dashboard-goals-card'), '.dashboard-goals-card SCSS rules present');

    // 11. Dashboard Stats API Validation
    console.log('\n--- TEST 11: Live Dashboard Stats API Calculations ---');
    const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { Cookie: cookie },
    });
    assert(statsRes.status === 200, 'Stats endpoint responds with HTTP 200');
    const stats = await statsRes.json();
    assert(typeof stats.availableBalance === 'number', `Available balance is valid number (${stats.availableBalance})`);
    assert(typeof stats.monthlyIncome === 'number', `Monthly income is valid number (${stats.monthlyIncome})`);
    assert(typeof stats.monthlyExpenses === 'number', `Monthly expenses is valid number (${stats.monthlyExpenses})`);
    assert(typeof stats.totalIncome === 'number', `Total income is valid number (${stats.totalIncome})`);
    assert(typeof stats.totalExpenses === 'number', `Total expenses is valid number (${stats.totalExpenses})`);
    assert(stats.outstandingMoney && typeof stats.outstandingMoney.lentPending === 'number', 'Outstanding lent pending is number');
    assert(stats.outstandingMoney && typeof stats.outstandingMoney.borrowedPending === 'number', 'Outstanding borrowed pending is number');
    assert(Array.isArray(stats.incomeVsExpenseMonthly) && stats.incomeVsExpenseMonthly.length === 6, '6 Months income vs expense history returned');
    assert(Array.isArray(stats.categoryWiseExpenses), 'Category wise expenses array returned');
    assert(Array.isArray(stats.recentTransactions), 'Recent transactions array returned');
    assert(stats.budgetRemaining && typeof stats.budgetRemaining.remaining === 'number', 'Budget remaining calculation returned');

    console.log('\n=========================================');
    console.log(`DASHBOARD UI TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=========================================');

    if (failed === 0) {
      console.log('🎉 ALL DASHBOARD UI TESTS PASSED WITH 100% SUCCESS!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error running dashboard UI tests:', err);
    process.exit(1);
  }
}

runDashboardUITests();
