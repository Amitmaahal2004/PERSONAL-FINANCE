# MyFinance — Personal Finance Management Web Application
> **Tagline:** Your Money. Your Records. Your Control.

MyFinance is a complete, modern, secure, and mobile-first Personal Finance Management Web Application built with Next.js 14+ (App Router), TypeScript, Tailwind CSS, and MongoDB (Mongoose).

---

## 🌟 Key Highlights & Features

### 1. Minimal & Elegant Design
- Premium light theme with soft whites and greys, emerald green accents (`#059669`).
- Smooth micro-interactions, responsive typography, and rounded cards.
- **Mobile-First Responsive Layout:** Dedicated bottom navigation bar, floating 1-tap quick expense logger, and PWA installability.
- Professional desktop sidebar and top navigation with Global Search (`Ctrl+K` / `Cmd+K`).

### 2. Multi-User & Strict Tenant Data Isolation
- Built for multi-tenant usage with **100% private financial workspaces**.
- Server-side session verification on **every** API endpoint (`GET`, `POST`, `PUT`, `DELETE`, `Export`).
- Users cannot access another user's records by tampering with URL parameters or payload IDs.
- Normal registered users cannot access Super Admin features.

### 3. Public Landing Page
- Minimalist hero section: *"Take Control of Your Money."*
- Interactive sample financial dashboard preview.
- Feature breakdown, 3-step workflow, privacy assurance, and collapsible FAQ.

### 4. Authentication System
- Secure password hashing with `bcryptjs`.
- HTTP-Only secure session cookies using signed JWTs.
- Features: Sign Up, Login, Forgot Password (token-based reset), Reset Password, Email Verification, Logout.
- In-memory rate limiting against brute-force attacks.

### 5. Financial Dashboard & Real-Time KPIs
- **8 KPI Cards:** Available Balance, Monthly Income, Monthly Expenses, Total Savings, Total Income (All-Time), Total Expenses (All-Time), Outstanding Money (Lent vs Borrowed), Budget Remaining.
- **Interactive Recharts Visualizations:**
  - 6-Month Income vs Expense comparison.
  - Category-wise expense donut breakdown with percentages and color codes.
  - Recent transactions list.
  - Upcoming recurring payment dues with 1-click execution.
  - Active savings goals and monthly budget progress bars.

### 6. Accurate Double-Entry Ledger Principles
- **Decimal-safe calculations** preventing floating-point precision errors.
- **Available Balance** strictly derived from opening balances + valid transaction ledger.
- **Zero-Impact Internal Transfers:** Moving money between accounts (e.g., Cash ↔ Bank) modifies account balances atomically without inflating income or expenses.
- **Savings Contributions:** Direct fund movements from bank accounts into savings goals do not falsely register as expenses.
- **Lending & Borrowing:** Money lent or borrowed is tracked distinctly without being misclassified as general income or expenses.

### 7. Core Modules Included
- **Transaction Management:** Incomes & Expenses, search, category/account/date filters, sorting, pagination, and receipt attachments (Images & PDF bills).
- **Multiple Financial Accounts:** Cash Wallet, Bank accounts, Savings, Credit Cards, UPI, Wallets with real-time balance reconciliation.
- **Category Management:** 15 default expense categories and 8 default income categories auto-seeded on signup, with custom color/icon pickers and safe-delete validation.
- **Budget Management:** Monthly overall limits and category targets with visual threshold alerts at 70%, 90%, and 100%+.
- **Savings Goals:** Milestone target tracking with account-funded contributions.
- **Loans & Borrowing:** Personal lending/borrowing records, due date reminders, partial repayment tracking, and overdue status.
- **Recurring Transactions:** Daily, weekly, monthly, and yearly recurring schedules with 1-click payment execution.
- **Financial Calendar:** Interactive monthly calendar displaying income, expenses, and upcoming dues with a day inspection drawer.
- **Reports & Intelligence:** Filter by Today, Yesterday, Last 7 Days, This Month, Last Month, This Year, or Custom Ranges. Exports directly to **PDF**, **Excel (.xlsx)**, and **CSV**.
- **User Profile & Settings:** Profile picture uploads, preferred currency selection (INR ₹ default, USD, EUR, GBP, etc.), date formats, and timezone.
- **Platform Super Admin:** User moderation dashboard, ban/unban capabilities, cascading user deletion following data-retention policies, and platform metrics, with financial transaction privacy strictly preserved.

---

## 🚀 Getting Started

### 1. Environment Configuration
Inspect or create `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/myfinance
JWT_SECRET=super_secret_jwt_myfinance_key_secure_random_2026_finance_token
SUPER_ADMIN_EMAIL=admin@myfinance.app
SUPER_ADMIN_PASSWORD=AdminSecurePassword123!
SUPER_ADMIN_NAME="Super Administrator"
NEXT_PUBLIC_APP_NAME=MyFinance
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
*(Note: If `MONGODB_URI` is omitted during local development, an embedded MongoDB Memory Server will automatically start for instant, zero-configuration local testing).*

### 2. Install & Run
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```
The application will be accessible at: `http://localhost:3000`.

### 3. Automated End-to-End Test Suite
Run the 49-point automated validation suite:
```bash
npm run test:e2e
```
This tests public landing pages, multi-user isolation, balance mathematics, budgets, loans, recurring dues, admin moderation, and exports.

---

## 🔒 Security Architecture
- Document-level user ownership verification on every database operation.
- No plain-text passwords stored; salted bcrypt encryption.
- HTTP-Only `SameSite=Lax` cookies preventing XSS token harvesting.
- Clean separation between Platform Super Admin management and private user ledgers.

