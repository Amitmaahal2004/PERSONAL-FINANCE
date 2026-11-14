const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting Comprehensive MyFinance End-to-End Validation Suite...\n');
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
    // 1. Landing Page Test
    console.log('--- TEST 1: Public Landing Page ---');
    const landingRes = await fetch(`${BASE_URL}/`);
    assert(landingRes.status === 200, 'Landing page responds with HTTP 200');
    const landingHtml = await landingRes.text();
    assert(landingHtml.includes('Take Control of'), 'Hero headline "Take Control of Your Money" is present');
    assert(landingHtml.includes('MyFinance'), 'Brand name MyFinance is present');

    // 2. User A Registration & Auto-Defaults Seeding
    console.log('\n--- TEST 2: User A Registration & Seeding Defaults ---');
    const userAEmail = `testuser_a_${Date.now()}@example.com`;
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        email: userAEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        preferredCurrency: 'INR',
      }),
    });
    assert(regResA.status === 201, 'User A registered successfully with HTTP 201');
    const cookieA = regResA.headers.get('set-cookie');
    assert(cookieA && cookieA.includes('myfinance_token'), 'Session cookie issued upon registration');

    // 3. Verify User A seeded default categories and accounts
    console.log('\n--- TEST 3: Default Categories & Accounts Seeding ---');
    const catRes = await fetch(`${BASE_URL}/api/categories`, {
      headers: { Cookie: cookieA },
    });
    const catData = await catRes.json();
    assert(catData.categories && catData.categories.length >= 20, `Default categories seeded (found ${catData.categories?.length})`);
    assert(catData.categories.some(c => c.name === 'Food & Dining'), 'Default Food & Dining category exists');
    assert(catData.categories.some(c => c.name === 'Salary'), 'Default Salary category exists');

    const accRes = await fetch(`${BASE_URL}/api/accounts`, {
      headers: { Cookie: cookieA },
    });
    const accData = await accRes.json();
    assert(accData.accounts && accData.accounts.length >= 2, `Default accounts seeded (found ${accData.accounts?.length})`);
    const cashAcc = accData.accounts.find(a => a.accountName === 'Cash Wallet');
    const bankAcc = accData.accounts.find(a => a.accountName === 'Main Bank Account');
    assert(cashAcc && bankAcc, 'Both Cash Wallet and Main Bank Account exist');

    // 4. Record Income & Expense Transactions for User A
    console.log('\n--- TEST 4: Transaction Creation & Balance Mechanics ---');
    // Add Salary Income: ₹75,000 to Bank Account
    const incomeRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: 'Monthly Tech Salary',
        amount: 75000,
        type: 'income',
        category: 'Salary',
        accountId: bankAcc._id,
        paymentMethod: 'UPI',
        date: new Date().toISOString(),
      }),
    });
    assert(incomeRes.status === 201, 'Salary income recorded successfully');

    // Add Expense: ₹4,500 from Bank Account for Grocery
    const expRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: 'Supermarket Grocery',
        amount: 4500,
        type: 'expense',
        category: 'Food & Dining',
        accountId: bankAcc._id,
        paymentMethod: 'UPI',
        date: new Date().toISOString(),
      }),
    });
    assert(expRes.status === 201, 'Grocery expense recorded successfully');

    // Verify updated bank balance: 75000 - 4500 = 70500
    const accCheckRes = await fetch(`${BASE_URL}/api/accounts`, {
      headers: { Cookie: cookieA },
    });
    const accCheckData = await accCheckRes.json();
    const updatedBank = accCheckData.accounts.find(a => a._id === bankAcc._id);
    assert(updatedBank.currentBalance === 70500, `Bank balance correctly updated to 70500 (got ${updatedBank.currentBalance})`);

    // 5. Internal Money Transfer (Cash <- Bank)
    console.log('\n--- TEST 5: Internal Money Transfer (Zero Income/Expense Impact) ---');
    const transferRes = await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fromAccountId: bankAcc._id,
        toAccountId: cashAcc._id,
        amount: 5000,
        notes: 'ATM Cash Withdrawal',
      }),
    });
    assert(transferRes.status === 200, 'Internal transfer processed successfully');

    // Check balances: Bank = 70500 - 5000 = 65500; Cash = 0 + 5000 = 5000; Total = 70500
    const accAfterTransfer = await fetch(`${BASE_URL}/api/accounts`, {
      headers: { Cookie: cookieA },
    });
    const accTransferData = await accAfterTransfer.json();
    const bankAfter = accTransferData.accounts.find(a => a._id === bankAcc._id);
    const cashAfter = accTransferData.accounts.find(a => a._id === cashAcc._id);
    assert(bankAfter.currentBalance === 65500, `Bank decreased to 65500 (got ${bankAfter.currentBalance})`);
    assert(cashAfter.currentBalance === 5000, `Cash increased to 5000 (got ${cashAfter.currentBalance})`);
    assert(accTransferData.totalBalance === 70500, `Total available balance maintained at 70500 (got ${accTransferData.totalBalance})`);

    // Verify transfer didn't create artificial income or expense
    const txSummary = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: cookieA },
    });
    const txSummaryData = await txSummary.json();
    assert(txSummaryData.summary.totalIncome === 75000, `Total Income remains 75000 (got ${txSummaryData.summary.totalIncome})`);
    assert(txSummaryData.summary.totalExpenses === 4500, `Total Expenses remains 4500 (got ${txSummaryData.summary.totalExpenses})`);

    // 6. Budgets & Threshold Alerting
    console.log('\n--- TEST 6: Budget Management & Thresholds ---');
    const budgetRes = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        categoryName: 'Food & Dining',
        monthlyBudget: 5000,
        alertThreshold70: true,
        alertThreshold90: true,
        alertThreshold100: true,
      }),
    });
    assert(budgetRes.status === 201, 'Food budget of ₹5,000 configured');

    const budgetListRes = await fetch(`${BASE_URL}/api/budgets`, {
      headers: { Cookie: cookieA },
    });
    const budgetListData = await budgetListRes.json();
    const foodBudget = budgetListData.budgets.find(b => b.categoryName === 'Food & Dining');
    assert(foodBudget && foodBudget.spent === 4500, `Budget spent calculated from transactions: 4500 (got ${foodBudget?.spent})`);
    assert(foodBudget && foodBudget.percentageUsed === 90, `Percentage used is 90% (got ${foodBudget?.percentageUsed}%)`);
    assert(foodBudget && foodBudget.isAlert90 === true, '90% budget alert triggered as expected');

    // 7. Savings Goals & Contributions
    console.log('\n--- TEST 7: Savings Goals & Non-Double-Counted Contributions ---');
    const goalRes = await fetch(`${BASE_URL}/api/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        goalName: 'Emergency Reserve',
        targetAmount: 100000,
        currentSavedAmount: 0,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const goalData = await goalRes.json();
    assert(goalRes.status === 201, 'Emergency Fund savings goal created');

    // Contribute ₹15,000 funded from Bank Account
    const contribRes = await fetch(`${BASE_URL}/api/savings/${goalData.goal._id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        amount: 15000,
        accountId: bankAcc._id,
        notes: 'Monthly savings allocation',
      }),
    });
    assert(contribRes.status === 200, 'Contribution recorded with account linkage');
    const contribData = await contribRes.json();
    assert(contribData.goal.currentSavedAmount === 15000, `Saved amount updated to 15000 (got ${contribData.goal.currentSavedAmount})`);

    // 8. Lending & Borrowing with Repayment
    console.log('\n--- TEST 8: Lending, Borrowing & Repayment ---');
    const loanRes = await fetch(`${BASE_URL}/api/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        type: 'lent',
        personName: 'Rohan Gupta',
        amount: 10000,
        notes: 'Personal advance for home renovation',
      }),
    });
    const loanData = await loanRes.json();
    assert(loanRes.status === 201, 'Loan of ₹10,000 recorded');

    // Record partial repayment of ₹4,000
    const repayRes = await fetch(`${BASE_URL}/api/loans/${loanData.loan._id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        amount: 4000,
        notes: 'First installment via UPI',
      }),
    });
    assert(repayRes.status === 200, 'Repayment recorded successfully');
    const repayData = await repayRes.json();
    assert(repayData.loan.remainingAmount === 6000, `Remaining balance is 6000 (got ${repayData.loan.remainingAmount})`);
    assert(repayData.loan.status === 'partially_paid', 'Loan status updated to partially_paid');

    // 9. Recurring Transactions
    console.log('\n--- TEST 9: Recurring Payments & Processing ---');
    const recurRes = await fetch(`${BASE_URL}/api/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: 'Broadband Fiber Internet',
        amount: 999,
        type: 'expense',
        category: 'Mobile & Internet',
        accountId: bankAcc._id,
        frequency: 'monthly',
        startDate: new Date().toISOString(),
      }),
    });
    const recurData = await recurRes.json();
    assert(recurRes.status === 201, 'Recurring internet payment scheduled');

    // Process recurring payment
    const processRes = await fetch(`${BASE_URL}/api/recurring/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        recurringId: recurData.recurring._id,
      }),
    });
    assert(processRes.status === 200, 'Recurring payment processed and transaction generated');

    // 10. Global Search
    console.log('\n--- TEST 10: Global Search ---');
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Grocery`, {
      headers: { Cookie: cookieA },
    });
    const searchData = await searchRes.json();
    assert(searchData.transactions && searchData.transactions.length > 0, 'Global search found Grocery transaction');
    assert(searchData.transactions[0].title.includes('Grocery'), 'Search result title matches query');

    // 11. STRICT USER DATA ISOLATION TEST
    console.log('\n--- TEST 11: Strict Multi-User Data Isolation ---');
    // Register User B
    const userBEmail = `testuser_b_${Date.now()}@example.com`;
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Patel',
        email: userBEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        preferredCurrency: 'INR',
      }),
    });
    const cookieB = regResB.headers.get('set-cookie');
    assert(regResB.status === 201, 'User B registered');

    // User B fetches transactions -> MUST NOT see User A's transactions!
    const txResB = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: cookieB },
    });
    const txDataB = await txResB.json();
    assert(txDataB.transactions.length === 0, `User B sees 0 transactions (strict isolation confirmed, got ${txDataB.transactions.length})`);

    // User B tries to directly GET User A's bank account by ID
    const directAccessRes = await fetch(`${BASE_URL}/api/accounts/${bankAcc._id}`, {
      headers: { Cookie: cookieB },
    });
    assert(directAccessRes.status === 404, `User B cannot access User A's account by ID (HTTP ${directAccessRes.status})`);

    // User B tries to delete User A's transaction
    const userATxs = await (await fetch(`${BASE_URL}/api/transactions`, { headers: { Cookie: cookieA } })).json();
    const txAId = userATxs.transactions[0]._id;
    const maliciousDelete = await fetch(`${BASE_URL}/api/transactions/${txAId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert(maliciousDelete.status === 404, `Cross-user deletion attempt blocked with 404 (got ${maliciousDelete.status})`);

    // 12. Super Admin Panel & User Management
    console.log('\n--- TEST 12: Super Admin Provisioning & User Moderation ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@myfinance.app',
        password: 'AdminSecurePassword123!',
      }),
    });
    assert(adminLoginRes.status === 200, 'Super Admin logged in successfully');
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    const adminData = await adminLoginRes.json();
    assert(adminData.user.role === 'admin', 'Admin role verified in session');

    // Admin fetches stats
    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminStatsRes.status === 200, 'Super admin stats endpoint accessible to admin');
    const adminStats = await adminStatsRes.json();
    assert(adminStats.totalUsers >= 2, `Total registered users tracked correctly (${adminStats.totalUsers})`);

    // Normal user attempts to access admin stats -> MUST FAIL with 403 Forbidden!
    const normalUserAdminAttempt = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: cookieA },
    });
    assert(normalUserAdminAttempt.status === 403, 'Normal user blocked from admin endpoint with 403 Forbidden');

    // Admin bans User B
    const adminUsersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    const usersList = await adminUsersRes.json();
    const userBDoc = usersList.users.find(u => u.email === userBEmail);
    assert(userBDoc, 'User B found in administrator registry');

    const banRes = await fetch(`${BASE_URL}/api/admin/users/${userBDoc._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isBanned: true, banReason: 'Suspicious test activity' }),
    });
    assert(banRes.status === 200, 'User B suspended by Super Admin');

    // Verify Banned User B is immediately blocked from logging in
    const bannedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: 'Password123!' }),
    });
    assert(bannedLoginRes.status === 403, 'Banned user rejected from logging in with 403 Forbidden');

    // 13. Reports Export Verification
    console.log('\n--- TEST 13: Reports & Export Endpoints ---');
    const exportCsvRes = await fetch(`${BASE_URL}/api/transactions/export?format=csv`, {
      headers: { Cookie: cookieA },
    });
    assert(exportCsvRes.status === 200, 'CSV export endpoint returns HTTP 200');
    const csvContent = await exportCsvRes.text();
    assert(csvContent.includes('Date,Title,Type,Amount'), 'CSV contains proper headers');
    assert(csvContent.includes('Monthly Tech Salary'), 'CSV contains user transactions');

    // 14. DEDICATED UDHAAR MANAGEMENT TESTS
    console.log('\n--- TEST 14: Dedicated Udhaar Management Module ---');

    // Get current bank account balance before Udhaar
    const preUdhaarAccs = await (await fetch(`${BASE_URL}/api/accounts`, { headers: { Cookie: cookieA } })).json();
    const preBankBalance = preUdhaarAccs.accounts.find(a => a.accountName === 'Main Bank Account').currentBalance;

    // Create Udhaar Lent: ₹10,000 to Rahul Sharma from Main Bank Account
    const udhaarLentRes = await fetch(`${BASE_URL}/api/udhaar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        type: 'lent',
        personName: 'Rahul Sharma',
        phoneNumber: '9876543210',
        originalAmount: 10000,
        udhaarDate: '2026-11-01',
        expectedRepaymentDate: '2026-11-20',
        paymentMethod: 'UPI',
        accountId: bankAcc._id,
        description: 'Urgent medical assistance',
      }),
    });
    assert(udhaarLentRes.status === 200, 'Udhaar Lent created successfully');
    const udhaarLentData = await udhaarLentRes.json();
    const lentRecordId = udhaarLentData.data._id;
    assert(udhaarLentData.data.recordId.startsWith('UDH-'), 'Auto-generated Record ID starts with UDH-');
    assert(udhaarLentData.data.remainingAmount === 10000, 'Initial remaining amount equals original amount (₹10,000)');

    // Verify bank account was deducted by ₹10,000
    const postLentAccs = await (await fetch(`${BASE_URL}/api/accounts`, { headers: { Cookie: cookieA } })).json();
    const postLentBalance = postLentAccs.accounts.find(a => a.accountName === 'Main Bank Account').currentBalance;
    assert(postLentBalance === preBankBalance - 10000, `Bank balance deducted by ₹10,000 on Lent creation (${preBankBalance} -> ${postLentBalance})`);

    // Create Udhaar Borrowed: ₹6,000 from Vikram Singh into Main Bank Account
    const udhaarBorrowedRes = await fetch(`${BASE_URL}/api/udhaar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        type: 'borrowed',
        personName: 'Vikram Singh',
        phoneNumber: '9123456780',
        originalAmount: 6000,
        udhaarDate: '2026-11-05',
        expectedRepaymentDate: '2026-11-30',
        paymentMethod: 'Bank Transfer',
        accountId: bankAcc._id,
        description: 'Temporary bridge loan',
      }),
    });
    assert(udhaarBorrowedRes.status === 200, 'Udhaar Borrowed created successfully');
    const udhaarBorrowedData = await udhaarBorrowedRes.json();
    const borrowedRecordId = udhaarBorrowedData.data._id;

    // Verify bank account was credited by ₹6,000
    const postBorrowedAccs = await (await fetch(`${BASE_URL}/api/accounts`, { headers: { Cookie: cookieA } })).json();
    const postBorrowedBalance = postBorrowedAccs.accounts.find(a => a.accountName === 'Main Bank Account').currentBalance;
    assert(postBorrowedBalance === postLentBalance + 6000, `Bank balance credited by ₹6,000 on Borrowed creation (${postLentBalance} -> ${postBorrowedBalance})`);

    // Check Udhaar summary stats
    const udhaarListRes = await fetch(`${BASE_URL}/api/udhaar?tab=all`, { headers: { Cookie: cookieA } });
    const udhaarList = await udhaarListRes.json();
    assert(udhaarList.summary.totalMoneyLent === 10000, `Summary Total Lent is ₹10,000 (got ${udhaarList.summary.totalMoneyLent})`);
    assert(udhaarList.summary.totalMoneyBorrowed === 6000, `Summary Total Borrowed is ₹6,000 (got ${udhaarList.summary.totalMoneyBorrowed})`);
    assert(udhaarList.summary.pendingReceivables === 10000, `Summary Pending Receivables is ₹10,000`);
    assert(udhaarList.summary.pendingPayables === 6000, `Summary Pending Payables is ₹6,000`);

    // Partial Repayment: Rahul Sharma repays ₹3,000 on 12 Nov
    const partialRepayRes = await fetch(`${BASE_URL}/api/udhaar/${lentRecordId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        amount: 3000,
        date: '2026-11-12',
        paymentMethod: 'UPI',
        accountId: bankAcc._id,
        notes: 'Installment 1',
      }),
    });
    assert(partialRepayRes.status === 200, 'Partial repayment of ₹3,000 recorded');
    const partialData = await partialRepayRes.json();
    assert(partialData.data.remainingAmount === 7000, 'Remaining balance updated to ₹7,000');
    assert(partialData.data.status === 'partially_paid', 'Status transitioned to partially_paid');
    assert(partialData.data.repayments.length === 1, 'Repayment ledger holds 1 entry');

    // Verify bank account was credited by ₹3,000
    const postRepay1Accs = await (await fetch(`${BASE_URL}/api/accounts`, { headers: { Cookie: cookieA } })).json();
    const postRepay1Balance = postRepay1Accs.accounts.find(a => a.accountName === 'Main Bank Account').currentBalance;
    assert(postRepay1Balance === postBorrowedBalance + 3000, `Bank balance credited by ₹3,000 on repayment receipt`);

    // Final Repayment: Rahul Sharma repays remaining ₹7,000 on 15 Nov -> Fully Cleared!
    const finalRepayRes = await fetch(`${BASE_URL}/api/udhaar/${lentRecordId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        amount: 7000,
        date: '2026-11-15',
        paymentMethod: 'UPI',
        accountId: bankAcc._id,
        notes: 'Final settlement',
      }),
    });
    assert(finalRepayRes.status === 200, 'Final repayment of ₹7,000 recorded');
    const finalData = await finalRepayRes.json();
    assert(finalData.data.remainingAmount === 0, 'Remaining balance reached ₹0');
    assert(finalData.data.status === 'cleared', 'Status automatically transitioned to CLEARED');
    assert(finalData.data.settlementDate, 'Settlement date successfully recorded');
    assert(finalData.data.settlementDurationDays === 14, `Settlement duration correctly calculated as 14 days (got ${finalData.data.settlementDurationDays})`);

    // Verify Tab Filtering:
    // Cleared record MUST NOT appear in Active Udhaar tab
    const activeUdhaarRes = await fetch(`${BASE_URL}/api/udhaar?tab=active`, { headers: { Cookie: cookieA } });
    const activeUdhaar = await activeUdhaarRes.json();
    assert(!activeUdhaar.data.some(r => r._id === lentRecordId), 'Cleared record automatically excluded from Active Udhaar tab');

    // Cleared record MUST appear in Cleared History tab
    const clearedUdhaarRes = await fetch(`${BASE_URL}/api/udhaar?tab=cleared`, { headers: { Cookie: cookieA } });
    const clearedUdhaar = await clearedUdhaarRes.json();
    const clearedDoc = clearedUdhaar.data.find(r => r._id === lentRecordId);
    assert(clearedDoc, 'Cleared record present in Cleared History tab');
    assert(clearedDoc && clearedDoc.repayments.length === 2, 'Preserved all partial repayment entries');
    assert(clearedDoc && clearedDoc.settlementDurationDays === 14, 'Preserved settlement duration days in cleared history');

    // 15. GLOBAL TRASH & RECYCLE BIN SYSTEM
    console.log('\n--- TEST 15: Global Trash / Soft-Delete System ---');

    // Create a temporary transaction to delete and restore
    const tempTxRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: 'Refundable Coffee Machine',
        amount: 3500,
        type: 'expense',
        category: 'Shopping',
        accountId: bankAcc._id,
        paymentMethod: 'UPI',
        date: new Date().toISOString(),
      }),
    });
    const tempTx = (await tempTxRes.json()).transaction;

    // Normal DELETE moves to Trash (soft delete)
    const softDelRes = await fetch(`${BASE_URL}/api/transactions/${tempTx._id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    assert(softDelRes.status === 200, 'Transaction DELETE endpoint soft-deletes and responds HTTP 200');

    // Verify it disappeared from active transactions
    const checkActiveTxs = await (await fetch(`${BASE_URL}/api/transactions`, { headers: { Cookie: cookieA } })).json();
    assert(!checkActiveTxs.transactions.some(t => t._id === tempTx._id), 'Soft-deleted transaction absent from active transactions list');

    // Verify it appears in Trash
    const trashRes = await fetch(`${BASE_URL}/api/trash?module=transactions`, { headers: { Cookie: cookieA } });
    const trashData = await trashRes.json();
    const foundInTrash = trashData.data.find(t => t._id === tempTx._id);
    assert(foundInTrash, 'Soft-deleted transaction found in Recycle Bin');
    assert(foundInTrash.originalModule === 'transactions', 'Trash item preserves original module metadata');

    // Restore from Trash
    const restoreRes = await fetch(`${BASE_URL}/api/trash/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ module: 'transactions', id: tempTx._id }),
    });
    assert(restoreRes.status === 200, 'Transaction restored from Recycle Bin');

    // Verify it is active again
    const postRestoreTxs = await (await fetch(`${BASE_URL}/api/transactions`, { headers: { Cookie: cookieA } })).json();
    assert(postRestoreTxs.transactions.some(t => t._id === tempTx._id), 'Restored transaction returned to active ledger');

    // Soft delete Udhaar Borrowed record
    const delUdhaarRes = await fetch(`${BASE_URL}/api/udhaar/${borrowedRecordId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    assert(delUdhaarRes.status === 200, 'Udhaar record soft-deleted to Trash');

    const udhaarTrashCheck = await (await fetch(`${BASE_URL}/api/trash?module=udhaar`, { headers: { Cookie: cookieA } })).json();
    assert(udhaarTrashCheck.data.some(u => u._id === borrowedRecordId), 'Soft-deleted Udhaar found in Recycle Bin under udhaar module');

    // 16. GLOBAL BULK ACTIONS TESTS
    console.log('\n--- TEST 16: Global Bulk Actions ---');
    // Bulk Move to Trash: move tempTx
    const bulkTrashRes = await fetch(`${BASE_URL}/api/bulk/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ module: 'transactions', ids: [tempTx._id] }),
    });
    assert(bulkTrashRes.status === 200, 'Bulk Move to Trash succeeded');

    // Bulk Restore
    const bulkRestoreRes = await fetch(`${BASE_URL}/api/bulk/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ module: 'transactions', ids: [tempTx._id] }),
    });
    assert(bulkRestoreRes.status === 200, 'Bulk Restore succeeded');

    // Move to Trash again and test Permanent Deletion
    await fetch(`${BASE_URL}/api/bulk/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ module: 'transactions', ids: [tempTx._id] }),
    });

    const permanentDelRes = await fetch(`${BASE_URL}/api/trash/permanent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ module: 'transactions', ids: [tempTx._id] }),
    });
    assert(permanentDelRes.status === 200, 'Permanent delete succeeded');

    // Verify completely gone from trash
    const postPermTrash = await (await fetch(`${BASE_URL}/api/trash`, { headers: { Cookie: cookieA } })).json();
    assert(!postPermTrash.data.some(t => t._id === tempTx._id), 'Permanently deleted record completely purged from database');

    // 17. SERVER-SIDE PAGINATION
    console.log('\n--- TEST 17: Global Server-Side Pagination ---');
    const pagedTxsRes = await fetch(`${BASE_URL}/api/transactions?page=1&limit=10`, { headers: { Cookie: cookieA } });
    const pagedTxs = await pagedTxsRes.json();
    assert(pagedTxs.pagination && pagedTxs.pagination.limit === 10, 'Transaction API respects limit=10');
    assert(pagedTxs.pagination.page === 1, 'Transaction API returns page=1');

    const pagedUdhaarRes = await fetch(`${BASE_URL}/api/udhaar?page=1&limit=25`, { headers: { Cookie: cookieA } });
    const pagedUdhaar = await pagedUdhaarRes.json();
    assert(pagedUdhaar.pagination && pagedUdhaar.pagination.limit === 25, 'Udhaar API respects limit=25');

    // 18. MULTI-USER ISOLATION ON UDHAAR & TRASH
    console.log('\n--- TEST 18: Multi-User Isolation on Udhaar & Trash ---');
    const userBUdhaarRes = await fetch(`${BASE_URL}/api/udhaar?tab=all`, { headers: { Cookie: cookieB } });
    const userBUdhaar = await userBUdhaarRes.json();
    assert(userBUdhaar.data.length === 0, `User B sees 0 Udhaar records (isolated from User A, got ${userBUdhaar.data.length})`);

    const userBTrashRes = await fetch(`${BASE_URL}/api/trash`, { headers: { Cookie: cookieB } });
    const userBTrash = await userBTrashRes.json();
    assert(userBTrash.data.length === 0, `User B sees 0 Trash items (isolated from User A, got ${userBTrash.data.length})`);

    // 19. PUBLIC THEME ENDPOINT & ZERO-FLASH SERVER RENDERING
    console.log('\n--- TEST 19: Public Theme Endpoint & Zero-Flash Styling ---');
    const themeGetRes = await fetch(`${BASE_URL}/api/theme`);
    assert(themeGetRes.status === 200, 'Public GET /api/theme responds with HTTP 200');
    const themeGetData = await themeGetRes.json();
    assert(themeGetData.success === true, 'Theme response indicates success: true');
    assert(themeGetData.theme && themeGetData.theme.primaryColor, `Primary color returned (${themeGetData.theme?.primaryColor})`);
    assert(themeGetData.theme && themeGetData.theme.secondaryColor, `Secondary color returned (${themeGetData.theme?.secondaryColor})`);

    // Verify initial bootstrap in Landing Page HTML payload (Zero-FOUC)
    const initialPageRes = await fetch(`${BASE_URL}/`);
    const initialPageHtml = await initialPageRes.text();
    assert(initialPageHtml.includes('server-theme-bootstrap'), 'Landing page contains server-theme-bootstrap style element in <head>');
    assert(initialPageHtml.includes('--color-primary:'), 'Server-rendered :root contains --color-primary definition');

    // 20. ROLE-BASED ACCESS CONTROL ON THEME MODIFICATION
    console.log('\n--- TEST 20: Role-Based Access Control on Theme Modification ---');
    // Normal User A tries to modify theme
    const userAThemeAttempt = await fetch(`${BASE_URL}/api/admin/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ primaryColor: '#2563EB', secondaryColor: '#1E40AF' }),
    });
    assert(userAThemeAttempt.status === 403, 'Normal User A blocked from PUT /api/admin/theme with 403 Forbidden');

    // Normal User A tries to reset theme
    const userAResetAttempt = await fetch(`${BASE_URL}/api/admin/theme/reset`, {
      method: 'POST',
      headers: { Cookie: cookieA },
    });
    assert(userAResetAttempt.status === 403, 'Normal User A blocked from POST /api/admin/theme/reset with 403 Forbidden');

    // 21. SUPER ADMIN GLOBAL THEME CUSTOMIZATION & MONGODB PERSISTENCE
    console.log('\n--- TEST 21: Super Admin Theme Customization & Persistence ---');
    // Validation rejection test: Invalid HEX format
    const invalidHexRes = await fetch(`${BASE_URL}/api/admin/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ primaryColor: 'not-a-hex-color', secondaryColor: '#1E40AF' }),
    });
    assert(invalidHexRes.status === 400, 'Invalid HEX format rejected with HTTP 400 Bad Request');

    // Admin sets custom theme: Sapphire Blue (#2563EB) & Navy (#1E40AF)
    const setCustomThemeRes = await fetch(`${BASE_URL}/api/admin/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ primaryColor: '#2563EB', secondaryColor: '#1E40AF' }),
    });
    assert(setCustomThemeRes.status === 200, 'Super Admin successfully updated global theme to #2563EB / #1E40AF');
    const customThemeData = await setCustomThemeRes.json();
    assert(customThemeData.theme.primaryColor === '#2563EB', 'Updated primary color matches #2563EB');
    assert(customThemeData.theme.secondaryColor === '#1E40AF', 'Updated secondary color matches #1E40AF');

    // 22. GLOBAL PROPAGATION TO ALL USERS & PUBLIC VISITORS
    console.log('\n--- TEST 22: Global Propagation Across Multi-Tenant Platform ---');
    // Public theme endpoint immediately reflects the new colors
    const publicThemeUpdated = await (await fetch(`${BASE_URL}/api/theme`)).json();
    assert(publicThemeUpdated.theme.primaryColor === '#2563EB', 'Public API immediately reflects new primary color #2563EB');
    assert(publicThemeUpdated.theme.secondaryColor === '#1E40AF', 'Public API immediately reflects new secondary color #1E40AF');

    // Server-rendered HTML for User A reflects new theme
    const userAPageRes = await fetch(`${BASE_URL}/dashboard`, { headers: { Cookie: cookieA } });
    const userAPageHtml = await userAPageRes.text();
    assert(userAPageHtml.includes('#2563EB'), 'User A dashboard server-renders with updated primary color #2563EB');

    // 23. SUPER ADMIN THEME RESET TO DEFAULT
    console.log('\n--- TEST 23: Super Admin Theme Reset to Default ---');
    const resetThemeRes = await fetch(`${BASE_URL}/api/admin/theme/reset`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    assert(resetThemeRes.status === 200, 'Theme reset endpoint responded with HTTP 200');
    const resetThemeData = await resetThemeRes.json();
    assert(resetThemeData.theme.primaryColor === '#10B981', 'Theme reset successfully restored default primary #10B981');
    assert(resetThemeData.theme.secondaryColor === '#0F766E', 'Theme reset successfully restored default secondary #0F766E');

    // Verify public endpoint reflects reset
    const publicThemeAfterReset = await (await fetch(`${BASE_URL}/api/theme`)).json();
    assert(publicThemeAfterReset.theme.primaryColor === '#10B981', 'Public theme returns default Emerald #10B981');

    console.log('\n=========================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=========================================\n');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test runner exception:', err);
    process.exit(1);
  }
}

runTests();
