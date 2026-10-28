-- SecureFDR MySQL Database Schema
-- SIH26265 - Security Deposit / FDR Management Portal
-- Target RDBMS: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS securefdr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE securefdr_db;

-- 1. INSTITUTIONS
CREATE TABLE IF NOT EXISTS institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inst_code (institution_code),
  INDEX idx_inst_state (state),
  INDEX idx_inst_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN'
  institution_id INT NULL,
  designation VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role),
  INDEX idx_user_inst (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. INSTITUTION USER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS institution_user_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution_id INT NOT NULL,
  role_title VARCHAR(100) NOT NULL DEFAULT 'Authorized Signatory',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_inst (user_id, institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. FDR RECORDS
CREATE TABLE IF NOT EXISTS fdr_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institution_id INT NOT NULL,
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
  assigned_officer_id INT NULL,
  verification_status_label VARCHAR(100) NOT NULL DEFAULT 'Not Reviewed',
  additional_notes TEXT NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_fdr_status (status),
  INDEX idx_fdr_maturity (maturity_date),
  INDEX idx_fdr_inst (institution_id),
  INDEX idx_fdr_number (fdr_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fdr_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL DEFAULT 'FDR Certificate',
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  ocr_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  ocr_raw_text MEDIUMTEXT NULL,
  ocr_extracted_json TEXT NULL,
  discrepancy_summary TEXT NULL,
  uploaded_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_doc_fdr (fdr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. VERIFICATION TASKS
CREATE TABLE IF NOT EXISTS verification_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fdr_id INT NOT NULL,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  due_date DATE NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_officer (assigned_to),
  INDEX idx_task_fdr (fdr_id),
  INDEX idx_task_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. VERIFICATION HISTORY
CREATE TABLE IF NOT EXISTS verification_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fdr_id INT NOT NULL,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  action_by INT NOT NULL,
  findings TEXT NULL,
  decision VARCHAR(100) NULL,
  independent_evidence_ref VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vh_fdr (fdr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. RELEASE REQUESTS
CREATE TABLE IF NOT EXISTS release_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fdr_id INT NOT NULL,
  institution_id INT NOT NULL,
  request_reference VARCHAR(100) NOT NULL UNIQUE,
  request_date DATE NOT NULL,
  reason_for_release TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  clearance_remarks TEXT NULL,
  assigned_officer_id INT NULL,
  decision_by INT NULL,
  decision_date DATETIME NULL,
  release_confirmation_ref VARCHAR(255) NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fdr_id) REFERENCES fdr_records(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_rr_fdr (fdr_id),
  INDEX idx_rr_inst (institution_id),
  INDEX idx_rr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. RELEASE REQUEST DOCUMENTS
CREATE TABLE IF NOT EXISTS release_request_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  release_request_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (release_request_id) REFERENCES release_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  link_url VARCHAR(255) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(191) NULL,
  user_role VARCHAR(50) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NULL,
  change_summary TEXT NULL,
  ip_address VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
