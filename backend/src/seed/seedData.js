import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupTables() {
  const driver = await db.initDb();
  console.log(`[Seed] Initializing database schema for ${driver.type.toUpperCase()}...`);

  // DDL definitions compatible with MySQL and SQLite
  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      institution_code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Engineering & Technology',
      address TEXT NOT NULL,
      state VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      contact_name VARCHAR(150) NOT NULL,
      contact_email VARCHAR(150) NOT NULL,
      contact_phone VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role VARCHAR(50) NOT NULL,
      institution_id INTEGER NULL,
      designation VARCHAR(100) NULL,
      phone VARCHAR(50) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      last_login DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS institution_user_assignments (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      institution_id INTEGER NOT NULL,
      role_title VARCHAR(100) NOT NULL DEFAULT 'Authorized Signatory',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS fdr_records (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      institution_id INTEGER NOT NULL,
      record_type VARCHAR(80) NOT NULL DEFAULT 'Fixed Deposit Receipt',
      fdr_number VARCHAR(100) NULL,
      bank_name VARCHAR(150) NULL,
      branch_name VARCHAR(150) NULL,
      ifsc_code VARCHAR(50) NULL,
      deposit_amount DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      issue_date DATE NOT NULL,
      maturity_date DATE NOT NULL,
      deposit_holder_name VARCHAR(255) NOT NULL,
      deposit_purpose VARCHAR(255) NOT NULL,
      approval_reference VARCHAR(150) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      discrepancy_flag BOOLEAN DEFAULT FALSE,
      discrepancy_details TEXT NULL,
      assigned_officer_id INTEGER NULL,
      verification_status_label VARCHAR(100) NOT NULL DEFAULT 'Not Reviewed',
      additional_notes TEXT NULL,
      created_by INTEGER NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      fdr_id INTEGER NOT NULL,
      document_type VARCHAR(100) NOT NULL DEFAULT 'FDR Certificate',
      original_filename VARCHAR(255) NOT NULL,
      stored_filename VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      ocr_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      ocr_raw_text TEXT NULL,
      ocr_extracted_json TEXT NULL,
      discrepancy_summary TEXT NULL,
      uploaded_by INTEGER NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS verification_tasks (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      fdr_id INTEGER NOT NULL,
      assigned_to INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
      due_date DATE NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS verification_history (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      fdr_id INTEGER NOT NULL,
      previous_status VARCHAR(50) NOT NULL,
      new_status VARCHAR(50) NOT NULL,
      action_by INTEGER NOT NULL,
      findings TEXT NULL,
      decision VARCHAR(100) NULL,
      independent_evidence_ref VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
      FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS release_requests (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      fdr_id INTEGER NOT NULL,
      institution_id INTEGER NOT NULL,
      request_reference VARCHAR(100) NOT NULL UNIQUE,
      request_date DATE NOT NULL,
      reason_for_release TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      clearance_remarks TEXT NULL,
      assigned_officer_id INTEGER NULL,
      decision_by INTEGER NULL,
      decision_date DATETIME NULL,
      release_confirmation_ref VARCHAR(255) NULL,
      created_by INTEGER NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS release_request_documents (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      release_request_id INTEGER NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (release_request_id) REFERENCES release_requests(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      institution_id INTEGER NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
      link_url VARCHAR(255) NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      user_id INTEGER NULL,
      user_email VARCHAR(191) NULL,
      user_role VARCHAR(50) NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(50) NULL,
      change_summary TEXT NULL,
      ip_address VARCHAR(50) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY ${driver.isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description VARCHAR(255) NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tableDefinitions) {
    await db.execute(sql);
  }
  console.log('[Seed] Schema created successfully.');
}

export async function seedDatabase() {
  await setupTables();

  console.log('[Seed] Seeding sample data for SIH26265 demo...');

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Check if data already seeded
  const existingUsers = await db.query('SELECT count(*) as cnt FROM users');
  const count = existingUsers[0].cnt || existingUsers[0]['count(*)'] || 0;
  if (count > 0) {
    console.log('[Seed] Existing users found. Refreshing seed dataset for a clean demo state...');
    // Clear dependent tables in order
    await db.execute('DELETE FROM release_request_documents');
    await db.execute('DELETE FROM release_requests');
    await db.execute('DELETE FROM verification_history');
    await db.execute('DELETE FROM verification_tasks');
    await db.execute('DELETE FROM documents');
    await db.execute('DELETE FROM fdr_records');
    await db.execute('DELETE FROM institution_user_assignments');
    await db.execute('DELETE FROM notifications');
    await db.execute('DELETE FROM audit_logs');
    await db.execute('DELETE FROM system_settings');
    await db.execute('DELETE FROM users');
    await db.execute('DELETE FROM institutions');
  }

  // 1. Seed Institutions
  const institutions = [
    {
      code: 'INST-ND-1001',
      name: 'Delhi Institute of Advanced Engineering & Technology',
      category: 'Engineering & Technology',
      address: 'Hauz Khas Institutional Area, New Delhi',
      state: 'Delhi',
      district: 'South Delhi',
      pincode: '110016',
      contact_name: 'Dr. Ramesh Narayan',
      contact_email: 'admin@iitdelhi.ac.in',
      contact_phone: '+91 98100 12345'
    },
    {
      code: 'INST-RJ-1002',
      name: 'Pilani Technological & Science Academy',
      category: 'Engineering & Technology',
      address: 'Vidya Vihar Campus, Pilani',
      state: 'Rajasthan',
      district: 'Jhunjhunu',
      pincode: '333031',
      contact_name: 'Prof. Ananya Sen',
      contact_email: 'admin@bits.ac.in',
      contact_phone: '+91 98290 67890'
    },
    {
      code: 'INST-MH-1003',
      name: 'Maharashtra Technical Institute (VJTI Mumbai)',
      category: 'Polytechnic & Applied Sciences',
      address: 'H.R. Mahajani Road, Matunga, Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai City',
      pincode: '400019',
      contact_name: 'Dr. Sanjay Deshmukh',
      contact_email: 'admin@vjti.ac.in',
      contact_phone: '+91 98200 45678'
    },
    {
      code: 'INST-KA-1004',
      name: 'Bangalore College of Engineering & Management',
      category: 'Management & Technical Studies',
      address: 'Mysore Road, RV Vidyaniketan, Bengaluru',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      pincode: '560059',
      contact_name: 'Dr. K. Srinivas Rao',
      contact_email: 'principal@rvce-demo.edu.in',
      contact_phone: '+91 94480 11223'
    },
    {
      code: 'INST-TN-1005',
      name: 'Chennai Pharmaceutical & Research Institute',
      category: 'Pharmacy',
      address: 'Grand Southern Trunk Road, Guindy, Chennai',
      state: 'Tamil Nadu',
      district: 'Chennai',
      pincode: '600025',
      contact_name: 'Dr. Meenakshi Sundaram',
      contact_email: 'registrar@cpri-demo.ac.in',
      contact_phone: '+91 97900 88776'
    }
  ];

  const instMap = {};
  for (const inst of institutions) {
    const res = await db.execute(
      `INSERT INTO institutions (institution_code, name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [inst.code, inst.name, inst.category, inst.address, inst.state, inst.district, inst.pincode, inst.contact_name, inst.contact_email, inst.contact_phone]
    );
    instMap[inst.code] = res.insertId;
  }
  console.log(`[Seed] Seeded ${institutions.length} educational institutions.`);

  // 2. Seed Users
  const passwordAdmin = bcrypt.hashSync('Admin@123', 10);
  const passwordOfficer = bcrypt.hashSync('Officer@123', 10);
  const passwordInst = bcrypt.hashSync('Inst@123', 10);

  const users = [
    // Super Admin
    {
      email: 'admin@securefdr.gov.in',
      password: passwordAdmin,
      name: 'Sunil Verma, IAS (Super Admin)',
      role: 'SUPER_ADMIN',
      inst_id: null,
      designation: 'Director (Finance & Institutional Approvals)',
      phone: '+91 11 2958 1000'
    },
    // Verification Officers
    {
      email: 'officer.sharma@securefdr.gov.in',
      password: passwordOfficer,
      name: 'Dr. Rajesh Sharma',
      role: 'VERIFICATION_OFFICER',
      inst_id: null,
      designation: 'Senior Verification Officer (North Zone)',
      phone: '+91 11 2958 1022'
    },
    {
      email: 'officer.patel@securefdr.gov.in',
      password: passwordOfficer,
      name: 'Pooja Patel',
      role: 'VERIFICATION_OFFICER',
      inst_id: null,
      designation: 'Audit & Compliance Officer (West/South Zone)',
      phone: '+91 11 2958 1024'
    },
    // Institution Admins
    {
      email: 'admin@iitdelhi.ac.in',
      password: passwordInst,
      name: 'Dr. Ramesh Narayan',
      role: 'INSTITUTION_ADMIN',
      inst_id: instMap['INST-ND-1001'],
      designation: 'Dean (Academic Infrastructure)',
      phone: '+91 98100 12345'
    },
    {
      email: 'admin@bits.ac.in',
      password: passwordInst,
      name: 'Prof. Ananya Sen',
      role: 'INSTITUTION_ADMIN',
      inst_id: instMap['INST-RJ-1002'],
      designation: 'Registrar & Authorized Signatory',
      phone: '+91 98290 67890'
    },
    {
      email: 'admin@vjti.ac.in',
      password: passwordInst,
      name: 'Dr. Sanjay Deshmukh',
      role: 'INSTITUTION_ADMIN',
      inst_id: instMap['INST-MH-1003'],
      designation: 'Principal & Head of Institute',
      phone: '+91 98200 45678'
    }
  ];

  const userMap = {};
  for (const u of users) {
    const res = await db.execute(
      `INSERT INTO users (email, password_hash, full_name, role, institution_id, designation, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [u.email, u.password, u.name, u.role, u.inst_id, u.designation, u.phone]
    );
    userMap[u.email] = res.insertId;

    if (u.inst_id) {
      await db.execute(
        `INSERT INTO institution_user_assignments (user_id, institution_id, role_title)
         VALUES (?, ?, ?)`,
        [res.insertId, u.inst_id, u.designation]
      );
    }
  }
  console.log(`[Seed] Seeded ${users.length} authorized users with roles.`);

  // 3. System Settings
  const settings = [
    { key: 'maturity_reminder_intervals', value: '30,15,7,0', desc: 'Days before maturity to generate notifications' },
    { key: 'enable_ocr_auto_processing', value: 'true', desc: 'Automatically execute OCR parsing on file upload' },
    { key: 'min_deposit_tenure_months', value: '60', desc: 'Minimum deposit duration required for new course approvals (months)' },
    { key: 'auto_flag_discrepancies', value: 'true', desc: 'Flag records when form values diverge from OCR values' },
    { key: 'allowed_record_types', value: 'Fixed Deposit Receipt,Bank Guarantee,Government Security,Term Deposit Certificate', desc: 'Permitted security deposit instrument types' },
    { key: 'max_upload_size_mb', value: '10', desc: 'Maximum allowable document upload size in Megabytes' },
    { key: 'portal_prototype_notice', value: 'Prototype Demonstration for SIH26265. All data is synthetic.', desc: 'Public portal disclaimer' }
  ];

  for (const s of settings) {
    await db.execute(
      `INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)`,
      [s.key, s.value, s.desc]
    );
  }

  // Calculate dates relative to today
  const today = new Date();
  const formatYMD = (d) => d.toISOString().split('T')[0];

  const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatYMD(d);
  };

  const subYears = (years) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return formatYMD(d);
  };

  // 4. Seed FDR Records
  // We include:
  // 1) Verified record (Matures in 3 years)
  // 2) Verified record (Matures in 7 days - upcoming alert!)
  // 3) Verified record (Matures in 15 days - upcoming alert!)
  // 4) Verified record (Matured 10 days ago - overdue maturity alert!)
  // 5) Under Review record (Assigned to Officer Sharma, discrepancy flagged)
  // 6) Additional Documents Required record (Missing joint undertaking)
  // 7) Submitted record (Pending assignment)
  // 8) Bank Guarantee record (Alternate permitted deposit type)
  // 9) Draft record
  // 10) Rejected record (Invalid lien, unauthorized holder)

  const fdrList = [
    {
      inst_id: instMap['INST-ND-1001'],
      type: 'Fixed Deposit Receipt',
      num: 'SBI-FDR-2023-884102',
      bank: 'State Bank of India',
      branch: 'IIT Hauz Khas Special Branch, New Delhi',
      ifsc: 'SBIN0001077',
      amount: 3500000.00,
      currency: 'INR',
      issue: subYears(2),
      maturity: addDays(7), // 7 DAYS REMAINING!
      holder: 'Principal, Delhi Institute of Adv. Engg. / Joint AICTE Member Secretary',
      purpose: 'Security Deposit for Introduction of M.Tech Artificial Intelligence & Robotics',
      approval_ref: 'AICTE/NW/2022-23/APP-8841',
      status: 'Verified',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: userMap['officer.sharma@securefdr.gov.in'],
      verif_label: 'Independently Verified',
      notes: 'Lien confirmation letter received from SBI Regional Office on 14-Nov-2023.',
      creator: userMap['admin@iitdelhi.ac.in']
    },
    {
      inst_id: instMap['INST-ND-1001'],
      type: 'Fixed Deposit Receipt',
      num: 'PNB-FDR-2024-912800',
      bank: 'Punjab National Bank',
      branch: 'Green Park Extension, New Delhi',
      ifsc: 'PUNB0021400',
      amount: 1500000.00,
      currency: 'INR',
      issue: subYears(1),
      maturity: addDays(15), // 15 DAYS REMAINING!
      holder: 'Delhi Institute of Advanced Engg. / Joint Account AICTE',
      purpose: 'Mandatory Security Deposit for Polytechnic Wing Expansion',
      approval_ref: 'AICTE/NW/2023-24/EXT-1902',
      status: 'Verified',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: userMap['officer.sharma@securefdr.gov.in'],
      verif_label: 'Independently Verified',
      notes: 'Valid joint FDR with irrevocable lien mark in favor of AICTE.',
      creator: userMap['admin@iitdelhi.ac.in']
    },
    {
      inst_id: instMap['INST-RJ-1002'],
      type: 'Fixed Deposit Receipt',
      num: 'HDFC-FDR-2021-332901',
      bank: 'HDFC Bank Ltd',
      branch: 'Station Road, Pilani, Rajasthan',
      ifsc: 'HDFC0001890',
      amount: 5000000.00,
      currency: 'INR',
      issue: subYears(5),
      maturity: addDays(-10), // MATURED 10 DAYS AGO!
      holder: 'Pilani Technological & Science Academy / Regional Officer AICTE',
      purpose: 'Statutory Endowment Fund for Autonomous University Status Approval',
      approval_ref: 'AICTE/CW/2019-20/UNIV-004',
      status: 'Verified',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: userMap['officer.patel@securefdr.gov.in'],
      verif_label: 'Independently Verified',
      notes: 'FDR has completed its 5-year statutory tenure. Institution has applied for deposit release clearance.',
      creator: userMap['admin@bits.ac.in']
    },
    {
      inst_id: instMap['INST-MH-1003'],
      type: 'Fixed Deposit Receipt',
      num: 'BOB-FDR-2024-554201',
      bank: 'Bank of Baroda',
      branch: 'Matunga West, Mumbai',
      ifsc: 'BARB0MATUNG',
      amount: 2500000.00,
      currency: 'INR',
      issue: subYears(1),
      maturity: addDays(450),
      holder: 'VJTI Mumbai Tech Society',
      purpose: 'Security Deposit for PG Diploma in Cyber Physical Systems',
      approval_ref: 'AICTE/WRO/2024/PGD-998',
      status: 'Under Review',
      discrepancy: true, // DISCREPANCY DETECTED!
      discrepancy_details: 'Discrepancy detected: Deposit Amount on Form is ₹25,00,000, but document OCR text indicates ₹20,00,000. Also, Joint Holder name lacks AICTE prefix.',
      officer_id: userMap['officer.patel@securefdr.gov.in'],
      verif_label: 'Discrepancy Detected',
      notes: 'Discrepancy flagged automatically by OCR engine. Officer Patel reviewing discrepancies.',
      creator: userMap['admin@vjti.ac.in']
    },
    {
      inst_id: instMap['INST-MH-1003'],
      type: 'Fixed Deposit Receipt',
      num: 'ICICI-FDR-2024-441092',
      bank: 'ICICI Bank',
      branch: 'Dadar TT Circle, Mumbai',
      ifsc: 'ICIC0000047',
      amount: 1800000.00,
      currency: 'INR',
      issue: subYears(1),
      maturity: addDays(28), // 28 DAYS REMAINING!
      holder: 'VJTI Mumbai / Joint AICTE Member Secretary',
      purpose: 'Security Deposit for Intake Increase in Electronics Engg.',
      approval_ref: 'AICTE/WRO/2023/INT-773',
      status: 'Additional Documents Required',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: userMap['officer.patel@securefdr.gov.in'],
      verif_label: 'Manual Verification Required',
      notes: 'Officer requested original Bank Lien Confirmation Certificate signed by Branch Manager.',
      creator: userMap['admin@vjti.ac.in']
    },
    {
      inst_id: instMap['INST-RJ-1002'],
      type: 'Bank Guarantee',
      num: 'AXIS-BG-2024-77192',
      bank: 'Axis Bank',
      branch: 'Pilani Main Road, Rajasthan',
      ifsc: 'UTIB0001222',
      amount: 4000000.00,
      currency: 'INR',
      issue: subYears(1),
      maturity: addDays(180),
      holder: 'Pilani Tech Academy in Favor of AICTE New Delhi',
      purpose: 'Bank Guarantee in lieu of Cash Security Deposit for Integrated B.Tech-MBA',
      approval_ref: 'AICTE/NW/2024/BG-331',
      status: 'Submitted',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: null,
      verif_label: 'Not Reviewed',
      notes: 'Submitted by institution administrator. Pending assignment to verification officer queue.',
      creator: userMap['admin@bits.ac.in']
    },
    {
      inst_id: instMap['INST-ND-1001'],
      type: 'Fixed Deposit Receipt',
      num: 'CANARA-FDR-2024-11003',
      bank: 'Canara Bank',
      branch: 'Safdarjung Enclave, New Delhi',
      ifsc: 'CNRB0000412',
      amount: 1200000.00,
      currency: 'INR',
      issue: formatYMD(today),
      maturity: addDays(1825), // 5 years
      holder: 'Delhi Inst of Adv Engg / Joint Account',
      purpose: 'Mandatory Deposit for New Division in Computer Science',
      approval_ref: 'AICTE/NW/2025/NEW-102',
      status: 'Draft',
      discrepancy: false,
      discrepancy_details: null,
      officer_id: null,
      verif_label: 'Not Reviewed',
      notes: 'Draft record prepared by institution coordinator. Supporting documents upload pending.',
      creator: userMap['admin@iitdelhi.ac.in']
    },
    {
      inst_id: instMap['INST-KA-1004'],
      type: 'Fixed Deposit Receipt',
      num: 'IOB-FDR-2023-009941',
      bank: 'Indian Overseas Bank',
      branch: 'Kengeri Satellite Town, Bengaluru',
      ifsc: 'IOBA0001452',
      amount: 2000000.00,
      currency: 'INR',
      issue: subYears(2),
      maturity: addDays(365),
      holder: 'Bangalore College of Engineering Trust',
      purpose: 'Security Deposit for MBA Program approval',
      approval_ref: 'AICTE/SRO/2022/MBA-449',
      status: 'Rejected',
      discrepancy: true,
      discrepancy_details: 'Rejection Reason: Deposit receipt is in sole name of private trust without mandatory joint holding with AICTE. Bank confirmed no lien was registered.',
      officer_id: userMap['officer.patel@securefdr.gov.in'],
      verif_label: 'Discrepancy Detected',
      notes: 'Rejected following independent inquiry with branch manager. Institution must submit fresh joint FDR.',
      creator: null
    }
  ];

  const fdrMap = {};
  let idx = 1;
  for (const item of fdrList) {
    const res = await db.execute(
      `INSERT INTO fdr_records (
        institution_id, record_type, fdr_number, bank_name, branch_name, ifsc_code,
        deposit_amount, currency, issue_date, maturity_date, deposit_holder_name,
        deposit_purpose, approval_reference, status, discrepancy_flag, discrepancy_details,
        assigned_officer_id, verification_status_label, additional_notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.inst_id, item.type, item.num, item.bank, item.branch, item.ifsc,
        item.amount, item.currency, item.issue, item.maturity, item.holder,
        item.purpose, item.approval_ref, item.status, item.discrepancy ? 1 : 0, item.discrepancy_details,
        item.officer_id, item.verif_label, item.notes, item.creator
      ]
    );
    fdrMap[idx] = res.insertId;
    idx++;
  }
  console.log(`[Seed] Seeded ${fdrList.length} FDR & Deposit records.`);

  // 5. Seed Documents & Realistic OCR Metadata
  // We'll write sample dummy certificate files to backend/uploads so downloads and previews work!
  const samplePdfPath = path.resolve(uploadsDir, 'sample_fdr_certificate.pdf');
  const sampleImgPath = path.resolve(uploadsDir, 'sample_fdr_scan.jpg');
  fs.writeFileSync(samplePdfPath, '%PDF-1.4\n%Synthetic AICTE FDR Certificate for Demonstration\n%%EOF');
  fs.writeFileSync(sampleImgPath, 'Synthetic image file content for demo preview');

  const documents = [
    {
      fdr_id: fdrMap[1], // SBI FDR (Verified)
      type: 'FDR Certificate',
      orig_name: 'SBI_FDR_884102_Certified_Copy.pdf',
      stored_name: 'sample_fdr_certificate.pdf',
      size: 421000,
      mime: 'application/pdf',
      ocr_status: 'Completed',
      raw_text: 'STATE BANK OF INDIA\nFIXED DEPOSIT RECEIPT\nA/C No: 398200118841\nFDR No: SBI-FDR-2023-884102\nAmount: Rs. 35,00,000.00\nDeposit Holder: Principal, Delhi Institute of Adv. Engg. / Joint AICTE Member Secretary\nLien marked in favor of AICTE New Delhi',
      extracted: JSON.stringify({
        fdrNumber: 'SBI-FDR-2023-884102',
        bankName: 'State Bank of India',
        depositAmount: '3500000.00',
        issueDate: subYears(2),
        maturityDate: addDays(7),
        holderName: 'Principal, Delhi Institute of Adv. Engg. / Joint AICTE Member Secretary'
      }),
      discrepancy_summary: 'Exact Match: All fields match submitted form data within tolerance.',
      uploaded_by: userMap['admin@iitdelhi.ac.in']
    },
    {
      fdr_id: fdrMap[4], // BOB FDR (Discrepancy Detected)
      type: 'FDR Certificate',
      orig_name: 'BOB_Fixed_Deposit_Scan_2024.jpg',
      stored_name: 'sample_fdr_scan.jpg',
      size: 615000,
      mime: 'image/jpeg',
      ocr_status: 'Completed',
      raw_text: 'BANK OF BARODA\nTERM DEPOSIT RECEIPT\nRECEIPT NO: BOB-FDR-2024-554201\nPRINCIPAL SUM: RS 20,00,000\nHOLDER: VJTI Mumbai Tech Society\nBRANCH: Matunga West Mumbai',
      extracted: JSON.stringify({
        fdrNumber: 'BOB-FDR-2024-554201',
        bankName: 'Bank of Baroda',
        depositAmount: '2000000.00', // Note: Form has 2500000.00!
        issueDate: subYears(1),
        maturityDate: addDays(450),
        holderName: 'VJTI Mumbai Tech Society' // Missing Joint AICTE!
      }),
      discrepancy_summary: 'Discrepancy Detected: Form Amount (₹25,00,000) != OCR Extracted Amount (₹20,00,000). Joint holder does not mention AICTE.',
      uploaded_by: userMap['admin@vjti.ac.in']
    },
    {
      fdr_id: fdrMap[3], // HDFC FDR (Matured 10 days ago, for Release Request)
      type: 'FDR Certificate',
      orig_name: 'HDFC_Term_Deposit_Advice.pdf',
      stored_name: 'sample_fdr_certificate.pdf',
      size: 512000,
      mime: 'application/pdf',
      ocr_status: 'Completed',
      raw_text: 'HDFC BANK LTD\nFIXED DEPOSIT RECEIPT\nFDR No: HDFC-FDR-2021-332901\nDeposit Amount: Rs. 50,00,000\nIssue Date: 2021-10-16\nMaturity Date: 2026-10-16\nHolder: Pilani Technological & Science Academy / Regional Officer AICTE',
      extracted: JSON.stringify({
        fdrNumber: 'HDFC-FDR-2021-332901',
        bankName: 'HDFC Bank Ltd',
        depositAmount: '5000000.00',
        issueDate: subYears(5),
        maturityDate: addDays(-10),
        holderName: 'Pilani Technological & Science Academy / Regional Officer AICTE'
      }),
      discrepancy_summary: 'Exact Match: Verified by Officer Patel on 2021-11-05.',
      uploaded_by: userMap['admin@bits.ac.in']
    }
  ];

  for (const doc of documents) {
    await db.execute(
      `INSERT INTO documents (
        fdr_id, document_type, original_filename, stored_filename, file_path, file_size,
        mime_type, ocr_status, ocr_raw_text, ocr_extracted_json, discrepancy_summary, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.fdr_id, doc.type, doc.orig_name, doc.stored_name, doc.stored_name, doc.size,
        doc.mime, doc.ocr_status, doc.raw_text, doc.extracted, doc.discrepancy_summary, doc.uploaded_by
      ]
    );
  }
  console.log(`[Seed] Seeded ${documents.length} document records with OCR results.`);

  // 6. Seed Verification Tasks
  const tasks = [
    {
      fdr_id: fdrMap[4], // BOB Discrepancy
      to: userMap['officer.patel@securefdr.gov.in'],
      by: userMap['admin@securefdr.gov.in'],
      priority: 'High',
      due: addDays(2),
      status: 'In Progress',
      notes: 'URGENT: Review amount mismatch and missing joint-holder endorsement.'
    },
    {
      fdr_id: fdrMap[5], // ICICI Missing Docs
      to: userMap['officer.patel@securefdr.gov.in'],
      by: userMap['admin@securefdr.gov.in'],
      priority: 'Medium',
      due: addDays(5),
      status: 'Pending',
      notes: 'Check updated bank confirmation when uploaded by institution.'
    },
    {
      fdr_id: fdrMap[6], // Axis BG
      to: userMap['officer.sharma@securefdr.gov.in'],
      by: userMap['admin@securefdr.gov.in'],
      priority: 'High',
      due: addDays(3),
      status: 'Pending',
      notes: 'Inspect bank guarantee text against AICTE standard format.'
    }
  ];

  for (const t of tasks) {
    await db.execute(
      `INSERT INTO verification_tasks (fdr_id, assigned_to, assigned_by, priority, due_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.fdr_id, t.to, t.by, t.priority, t.due, t.status, t.notes]
    );
  }
  console.log(`[Seed] Seeded ${tasks.length} verification tasks.`);

  // 7. Seed Verification History (Audit trail of decisions)
  const history = [
    {
      fdr_id: fdrMap[1],
      prev: 'Submitted',
      curr: 'Under Review',
      by: userMap['officer.sharma@securefdr.gov.in'],
      findings: 'Document scan reviewed. Bank seal and signature verified.',
      decision: null,
      ref: null
    },
    {
      fdr_id: fdrMap[1],
      prev: 'Under Review',
      curr: 'Verified',
      by: userMap['officer.sharma@securefdr.gov.in'],
      findings: 'Independent confirmation letter received from SBI Branch Manager (Ref: SBI/IIT/2023/LN-4412). AICTE joint lien is verified.',
      decision: 'Verified',
      ref: 'SBI/IIT/2023/LN-4412'
    },
    {
      fdr_id: fdrMap[4],
      prev: 'Submitted',
      curr: 'Under Review',
      by: userMap['officer.patel@securefdr.gov.in'],
      findings: 'Discrepancy detected during OCR side-by-side analysis: Form amount ₹25,00,000 vs Document amount ₹20,00,000.',
      decision: 'Discrepancy Flagged',
      ref: null
    },
    {
      fdr_id: fdrMap[5],
      prev: 'Under Review',
      curr: 'Additional Documents Required',
      by: userMap['officer.patel@securefdr.gov.in'],
      findings: 'Original bank lien endorsement missing from upload. Requested official confirmation letter.',
      decision: 'Requested Documents',
      ref: null
    }
  ];

  for (const h of history) {
    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings, decision, independent_evidence_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [h.fdr_id, h.prev, h.curr, h.by, h.findings, h.decision, h.ref]
    );
  }

  // 8. Seed Release Requests
  // One for the matured HDFC FDR
  const releaseRes = await db.execute(
    `INSERT INTO release_requests (
      fdr_id, institution_id, request_reference, request_date, reason_for_release,
      status, clearance_remarks, assigned_officer_id, decision_by, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fdrMap[3], // HDFC matured deposit
      instMap['INST-RJ-1002'],
      'REL-2026-0041',
      formatYMD(today),
      'Completion of statutory 5-year endowment period following autonomous accreditation by NAAC with A++ grade. Requesting release of deposit lien as per AICTE Approval Process Handbook Clause 4.12.',
      'Under Review',
      'Pending regional office verification of university compliance and examination results.',
      userMap['officer.patel@securefdr.gov.in'],
      null,
      userMap['admin@bits.ac.in']
    ]
  );

  await db.execute(
    `INSERT INTO release_request_documents (release_request_id, document_name, file_path, file_size)
     VALUES (?, ?, ?, ?)`,
    [
      releaseRes.insertId,
      'NAAC_Accreditation_Certificate_A_Plus_Plus.pdf',
      'sample_fdr_certificate.pdf',
      340000
    ]
  );
  console.log('[Seed] Seeded release request with compliance attachment.');

  // 9. Seed Notifications
  const notifs = [
    {
      user_id: userMap['admin@iitdelhi.ac.in'],
      inst_id: instMap['INST-ND-1001'],
      title: 'Upcoming Maturity Alert (7 Days)',
      message: 'FDR SBI-FDR-2023-884102 of ₹35,00,000 will mature in 7 days on ' + addDays(7) + '. Please initiate renewal or review compliance guidelines.',
      type: 'MATURITY_ALERT',
      link: '/fdr/' + fdrMap[1]
    },
    {
      user_id: userMap['admin@iitdelhi.ac.in'],
      inst_id: instMap['INST-ND-1001'],
      title: 'Upcoming Maturity Alert (15 Days)',
      message: 'FDR PNB-FDR-2024-912800 of ₹15,00,000 will mature on ' + addDays(15) + '. Early notification sent.',
      type: 'MATURITY_ALERT',
      link: '/fdr/' + fdrMap[2]
    },
    {
      user_id: userMap['admin@vjti.ac.in'],
      inst_id: instMap['INST-MH-1003'],
      title: 'Document Correction Required',
      message: 'Verification Officer requested additional documents for FDR ICICI-FDR-2024-441092. Please upload certified Bank Lien Letter.',
      type: 'MISSING_DOCUMENT',
      link: '/fdr/' + fdrMap[5]
    },
    {
      user_id: userMap['officer.patel@securefdr.gov.in'],
      inst_id: null,
      title: 'New Verification Task Assigned',
      message: 'You have been assigned to review FDR BOB-FDR-2024-554201 (High Priority). Discrepancy detected in amount.',
      type: 'VERIFICATION_ASSIGNMENT',
      link: '/verifications/' + fdrMap[4]
    },
    {
      user_id: userMap['admin@securefdr.gov.in'],
      inst_id: null,
      title: 'New Release Request Submitted',
      message: 'Pilani Technological Academy submitted release request REL-2026-0041 for matured FDR ₹50,00,000.',
      type: 'RELEASE_UPDATE',
      link: '/release-requests'
    }
  ];

  for (const n of notifs) {
    await db.execute(
      `INSERT INTO notifications (user_id, institution_id, title, message, type, link_url, is_read)
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [n.user_id, n.inst_id, n.title, n.message, n.type, n.link]
    );
  }
  console.log(`[Seed] Seeded ${notifs.length} system notifications.`);

  // 10. Seed Audit Logs
  const auditEntries = [
    {
      user_id: userMap['admin@securefdr.gov.in'],
      email: 'admin@securefdr.gov.in',
      role: 'SUPER_ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'SYSTEM',
      id: '0',
      summary: 'SecureFDR portal database schema initialized and configuration validated.'
    },
    {
      user_id: userMap['admin@iitdelhi.ac.in'],
      email: 'admin@iitdelhi.ac.in',
      role: 'INSTITUTION_ADMIN',
      action: 'FDR_SUBMISSION',
      entity: 'FDR',
      id: String(fdrMap[1]),
      summary: 'Submitted FDR SBI-FDR-2023-884102 for ₹35,00,000 with certified certificate PDF.'
    },
    {
      user_id: userMap['officer.sharma@securefdr.gov.in'],
      email: 'officer.sharma@securefdr.gov.in',
      role: 'VERIFICATION_OFFICER',
      action: 'VERIFICATION_APPROVAL',
      entity: 'FDR',
      id: String(fdrMap[1]),
      summary: 'Verified FDR SBI-FDR-2023-884102 after confirming bank lien certificate SBI/IIT/2023/LN-4412.'
    },
    {
      user_id: userMap['admin@vjti.ac.in'],
      email: 'admin@vjti.ac.in',
      role: 'INSTITUTION_ADMIN',
      action: 'FDR_SUBMISSION',
      entity: 'FDR',
      id: String(fdrMap[4]),
      summary: 'Submitted FDR BOB-FDR-2024-554201 for ₹25,00,000.'
    },
    {
      user_id: userMap['officer.patel@securefdr.gov.in'],
      email: 'officer.patel@securefdr.gov.in',
      role: 'VERIFICATION_OFFICER',
      action: 'DISCREPANCY_FLAGGED',
      entity: 'FDR',
      id: String(fdrMap[4]),
      summary: 'Flagged amount mismatch between form (₹25L) and certificate OCR (₹20L).'
    },
    {
      user_id: userMap['admin@bits.ac.in'],
      email: 'admin@bits.ac.in',
      role: 'INSTITUTION_ADMIN',
      action: 'RELEASE_REQUEST_SUBMISSION',
      entity: 'RELEASE_REQUEST',
      id: 'REL-2026-0041',
      summary: 'Submitted deposit release request for completed 5-year statutory period.'
    }
  ];

  for (const a of auditEntries) {
    await db.execute(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, change_summary, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1')`,
      [a.user_id, a.email, a.role, a.action, a.entity, a.id, a.summary]
    );
  }
  console.log(`[Seed] Seeded ${auditEntries.length} immutable audit log entries.`);
  console.log('[Seed] Database successfully seeded with realistic demonstration dataset!');
}

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
