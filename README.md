# SecureFDR: Smart Security Deposit & Fixed Deposit Receipt (FDR) Management Portal
### Smart India Hackathon Prototype (SIH26265) &bull; AICTE Institutional Workflows

> **Disclaimer:** SecureFDR is an institutional workflow tracking and deposit record management prototype created for demonstration purposes under Smart India Hackathon (SIH26265). It does not collect, hold, or disburse real money, and is not an official AICTE or government website. All records are synthetic.

---

## 1. System Architecture Overview

SecureFDR streamlines and centralizes the lifecycle of security deposits and Fixed Deposit Receipts (FDRs) pledged by higher education and technical institutions to regulatory authorities (such as AICTE):

```
+-----------------------------------------------------------------------------------+
|                              REACT FRONTEND (Vite)                                |
|  - Enterprise Banking & Regulatory Portal UI (Deep Navy #0F1F33, Royal Blue)      |
|  - Role-Specific Dashboards (Super Admin, Verification Officer, Institution Admin)|
|  - 1-Click Fast Juror Demo Persona Switcher                                       |
|  - Side-by-Side OCR Discrepancy Comparison Inspection Screen                     |
|  - Analytics & Interactive Charts (Recharts) & CSV Export                         |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JWT Bearer Auth)
                                          v
+-----------------------------------------------------------------------------------+
|                             NODE.JS / EXPRESS BACKEND                             |
|  - Parameterized Database Query Engine (MySQL 8.0+ / Built-in SQLite Fallback)   |
|  - JWT Authentication & Bcrypt Password Hashing                                   |
|  - Role-Based Access Control (RBAC) & Institution Data Isolation                  |
|  - Document Management & Tesseract.js OCR Field Extraction                        |
|  - Configurable Maturity Alerts Service (30, 15, 7, 0 days)                       |
|  - Immutable Audit Logging Service & Notification Center                          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         DATABASE LAYER (12 Normalized Tables)                     |
|  institutions | users | institution_user_assignments | fdr_records | documents   |
|  verification_tasks | verification_history | release_requests | release_docs      |
|  notifications | audit_logs | system_settings                                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Default Demo Personas & Credentials

The seed script (`npm run seed`) automatically initializes realistic demonstration personas across all three role tiers:

| Persona Role | User Name | Email Address | Password | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Sunil Verma, IAS | `admin@securefdr.gov.in` | `Admin@123` | System oversight, user creation, assignment, final releases & audit |
| **Verification Officer** | Dr. Rajesh Sharma | `officer.sharma@securefdr.gov.in` | `Officer@123` | Document inspection, OCR discrepancy review, verification decisions |
| **Verification Officer** | Pooja Patel | `officer.patel@securefdr.gov.in` | `Officer@123` | Compliance checks, discrepancy review, release recommendations |
| **Institution Admin** | Dr. Ramesh Narayan | `admin@iitdelhi.ac.in` | `Inst@123` | Delhi Institute: FDR creation, uploads, release requests |
| **Institution Admin** | Prof. Ananya Sen | `admin@bits.ac.in` | `Inst@123` | Pilani Tech: FDR management & statutory submissions |
| **Institution Admin** | Dr. Sanjay Deshmukh | `admin@vjti.ac.in` | `Inst@123` | VJTI Mumbai: FDR management & correction responses |

> **Pro-Tip for Hackathon Jurors:** The login page features **"Juror 1-Click Fast Login"** cards. Additionally, an interactive **"Switch Persona"** dropdown in the top navbar allows you to immediately switch roles without logging out and typing passwords repeatedly.

---

## 3. Quick Start & Execution Guide (Windows / PowerShell / Terminal)

### Prerequisites
- **Node.js**: v18.0+ or v20.0+ (Tested on Node v24.19.0).
- **npm**: 9.x or later.
- **Database**: Works out of the box with zero external configuration using Node's built-in file-backed SQLite storage engine (`database/securefdr.sqlite`), **OR** connects seamlessly to a local/remote MySQL 8.0+ server (`securefdr_db`).

---

### Step 1: Install Dependencies

Open a terminal or PowerShell in the project root directory (`c:\Users\chals\fdr system`):

```bash
# Option A: Install both Backend & Frontend at once
npm run install:all

# Option B: Install individually
cd backend && npm install
cd ../frontend && npm install
```

---

### Step 2: Initialize Database and Populate Seed Records

Run the seed script from the project root:

```bash
# From project root
npm run seed

# OR from backend folder
cd backend
npm run seed
```

This will automatically create all 12 tables and seed:
- 5 educational institutions (Delhi, Pilani, Mumbai, Bangalore, Chennai)
- 6 authorized role-based users
- 8 realistic FDR and bank guarantee records across various states (Verified, Discrepancy Flagged, Under Review, Upcoming Maturities)
- Supporting document records with parsed OCR JSON metadata
- Live notification alerts and immutable audit logs

---

### Step 3: Run the Backend & Frontend Applications

In two separate terminals:

**Terminal 1 (Backend API Server):**
```bash
cd backend
npm run dev
# Server runs at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Vite development server runs at http://localhost:5173
```

Now open **`http://localhost:5173`** in your browser!

---

## 4. Automated Acceptance Criteria Test Suite

SecureFDR includes an automated verification test suite verifying all 13 critical acceptance criteria:

```bash
cd backend
npm test
```

**Automated Test Coverage:**
1. Health check & database connection
2. Super Admin, Officer, and Institution Admin authentication
3. Rejection of invalid credentials (401)
4. Role-based endpoint authorization enforcement (403)
5. Institution-level data isolation (Institution Admins cannot view or modify other institutions' records)
6. Date validation (rejection of maturity dates preceding issue dates)
7. Draft deposit creation and duplicate reference flagging
8. Token-protected document download security
9. Prohibition of self-approval by submitting users
10. Dynamic database calculations of dashboard KPIs
11. Immutable audit trail recording

---

## 5. Key System Workflows

### A. FDR Submission & Document Upload Workflow
1. Institution Admin logs in and navigates to **FDR Management &rarr; Create Deposit Record**.
2. Fills in bank details, deposit amount, maturity date, and AICTE approval reference.
3. System validates positive amount, verifies date horizons, and flags potential duplicate reference numbers.
4. Uploads supporting certificate scan (PDF, PNG, JPG).
5. OCR engine parses document text and matches fields against the form.
6. If amount or holder diverges, system flags **"Discrepancy Detected"**.
7. Institution submits record for verification.

### B. Verification Officer Review & Discrepancy Detection
1. Verification Officer views incoming tasks in the **Verification Queue**.
2. Opens **Side-by-Side OCR Compare Modal** (`Field | Submitted Value | OCR Value | Result`).
3. Highlights discrepancies in deposit values or joint-holder names.
4. Allows human officer to correct OCR reading errors and record substantive findings.
5. Officer records formal outcome:
   - **Verified**: Requires verifiable independent bank evidence reference.
   - **Rejected**: Details non-compliance grounds.
   - **Request Additional Documents**: Dispatches notification to institution to upload certified copies.

### C. Configurable Maturity Monitoring
- Default reminder thresholds: **30 days, 15 days, 7 days, 0 days** (configurable in System Settings).
- Background worker scans active records and dispatches alerts to institutional coordinators and Super Admins.
- Clarifies that maturity alert does **not** grant automatic right to release without formal regulatory clearance.

### D. Deposit Release Request Workflow
1. Institution submits release application citing statutory reason (e.g. completed 5-year endowment period, NAAC A++ accreditation).
2. Status progression: `Submitted` &rarr; `Under Review` &rarr; `Clearance Pending` &rarr; `Recommended` &rarr; `Approved` &rarr; `Released`.
3. Clearances from Regional Office and Competent Authority are recorded.
4. Final approval restricted to Super Admin.
5. All transitions logged to immutable audit trail.

---

## 6. MySQL Database Setup (Optional Production Configuration)

If you have a local MySQL 8.0+ server installed:

1. Create database and tables using the provided schema:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
2. Update `backend/.env`:
```env
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=securefdr_db
```
3. Restart the backend server.

---

## 7. Project Structure

```
fdr system/
├── README.md                      # Comprehensive project guide & architecture
├── package.json                   # Root orchestration scripts
├── .env.example                   # Sample environment configuration
├── database/
│   ├── schema.sql                 # MySQL normalized DDL schema (12 tables)
│   ├── seed.sql                   # MySQL synthetic demo seed records
│   └── securefdr.sqlite           # Local zero-config file database
├── backend/
│   ├── server.js                  # Express app, security headers, rate limiting
│   ├── tests/api.test.js          # Automated acceptance criteria test suite
│   ├── uploads/                   # Secure storage for supporting certificate files
│   └── src/
│       ├── config/                # DB driver abstraction (MySQL/SQLite) & JWT
│       ├── middleware/            # Auth, Role, Upload (Multer), Error Handler
│       ├── routes/                # Auth, FDR, Documents, Verifications, Releases, Reports...
│       └── services/              # OCR (Tesseract.js), Notifications, Audit, Maturity
└── frontend/
    ├── vite.config.js             # Vite configuration with backend proxy
    ├── tailwind.config.js         # Enterprise banking color system
    └── src/
        ├── App.jsx                # Router & protected role routes
        ├── context/               # AuthContext & NotificationContext
        ├── components/            # Layout (Sidebar, Navbar, Footer), Modal, StatCard, Badge
        │   └── ocr/               # OcrCompareModal (Side-by-side comparison screen)
        └── pages/                 # Role Dashboards, FDR CRUD, Verifications, Releases, Reports...
```

---

## 8. Technology Stack Summary

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios.
- **Backend**: Node.js, Express.js, JWT, Bcrypt.js, Multer, Helmet, Morgan, Tesseract.js.
- **Database**: MySQL 8.0+ / Built-in high-performance file-backed SQLite storage engine.
- **Theme**: Institutional Enterprise Banking Palette (Deep Navy `#0F1F33`, Royal Blue `#2563EB`, Emerald, Amber, Rose).
- **Compliance Tag**: SIH26265 Prototype &bull; Educational Institutional Security Deposit Management Portal.
