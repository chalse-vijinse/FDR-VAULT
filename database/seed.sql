-- SecureFDR Prototype Demonstration Seed SQL
-- SIH26265 - Security Deposit / FDR Management Portal
-- Synthetic demonstration dataset

USE securefdr_db;

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('maturity_reminder_intervals', '30,15,7,0', 'Days before maturity to generate notifications'),
('enable_ocr_auto_processing', 'true', 'Automatically execute OCR parsing on file upload'),
('min_deposit_tenure_months', '60', 'Minimum deposit duration required for new course approvals (months)'),
('auto_flag_discrepancies', 'true', 'Flag records when form values diverge from OCR values'),
('allowed_record_types', 'Fixed Deposit Receipt,Bank Guarantee,Government Security,Term Deposit Certificate', 'Permitted security deposit instrument types'),
('max_upload_size_mb', '10', 'Maximum allowable document upload size in Megabytes'),
('portal_prototype_notice', 'Prototype Demonstration for SIH26265. All data is synthetic.', 'Public portal disclaimer')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Sample Educational Institutions
INSERT INTO institutions (id, institution_code, name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status) VALUES
(1, 'INST-ND-1001', 'Delhi Institute of Advanced Engineering & Technology', 'Engineering & Technology', 'Hauz Khas Institutional Area, New Delhi', 'Delhi', 'South Delhi', '110016', 'Dr. Ramesh Narayan', 'admin@iitdelhi.ac.in', '+91 98100 12345', 'Active'),
(2, 'INST-RJ-1002', 'Pilani Technological & Science Academy', 'Engineering & Technology', 'Vidya Vihar Campus, Pilani', 'Rajasthan', 'Jhunjhunu', '333031', 'Prof. Ananya Sen', 'admin@bits.ac.in', '+91 98290 67890', 'Active'),
(3, 'INST-MH-1003', 'Maharashtra Technical Institute (VJTI Mumbai)', 'Polytechnic & Applied Sciences', 'H.R. Mahajani Road, Matunga, Mumbai', 'Maharashtra', 'Mumbai City', '400019', 'Dr. Sanjay Deshmukh', 'admin@vjti.ac.in', '+91 98200 45678', 'Active'),
(4, 'INST-KA-1004', 'Bangalore College of Engineering & Management', 'Management & Technical Studies', 'Mysore Road, RV Vidyaniketan, Bengaluru', 'Karnataka', 'Bengaluru Urban', '560059', 'Dr. K. Srinivas Rao', 'principal@rvce-demo.edu.in', '+91 94480 11223', 'Active'),
(5, 'INST-TN-1005', 'Chennai Pharmaceutical & Research Institute', 'Pharmacy', 'Grand Southern Trunk Road, Guindy, Chennai', 'Tamil Nadu', 'Chennai', '600025', 'Dr. Meenakshi Sundaram', 'registrar@cpri-demo.ac.in', '+91 97900 88776', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Demo Authorized Users
-- Passwords:
-- admin@securefdr.gov.in -> Admin@123
-- officer.sharma@securefdr.gov.in -> Officer@123
-- officer.patel@securefdr.gov.in -> Officer@123
-- admin@iitdelhi.ac.in -> Inst@123
-- admin@bits.ac.in -> Inst@123
-- admin@vjti.ac.in -> Inst@123
INSERT INTO users (id, email, password_hash, full_name, role, institution_id, designation, phone, status) VALUES
(1, 'admin@securefdr.gov.in', '$2a$10$wB5W.5q2vQ9kF6aZ5g2Dke777g113yN0Q4C2X7HhP7t1L4m4.0D8q', 'Sunil Verma, IAS (Super Admin)', 'SUPER_ADMIN', NULL, 'Director (Finance & Institutional Approvals)', '+91 11 2958 1000', 'Active'),
(2, 'officer.sharma@securefdr.gov.in', '$2a$10$T8Z.X2W8X9Z1K2l3.4m5ve.Q6W7E8R9T0Y1U2I3O4P5a6s7d8f9g', 'Dr. Rajesh Sharma', 'VERIFICATION_OFFICER', NULL, 'Senior Verification Officer (North Zone)', '+91 11 2958 1022', 'Active'),
(3, 'officer.patel@securefdr.gov.in', '$2a$10$T8Z.X2W8X9Z1K2l3.4m5ve.Q6W7E8R9T0Y1U2I3O4P5a6s7d8f9g', 'Pooja Patel', 'VERIFICATION_OFFICER', NULL, 'Audit & Compliance Officer (West/South Zone)', '+91 11 2958 1024', 'Active'),
(4, 'admin@iitdelhi.ac.in', '$2a$10$99x.Y8U7I6O5P4A3S2D1fe.1a2s3d4f5g6h7j8k9l0z1x2c3v4b', 'Dr. Ramesh Narayan', 'INSTITUTION_ADMIN', 1, 'Dean (Academic Infrastructure)', '+91 98100 12345', 'Active'),
(5, 'admin@bits.ac.in', '$2a$10$99x.Y8U7I6O5P4A3S2D1fe.1a2s3d4f5g6h7j8k9l0z1x2c3v4b', 'Prof. Ananya Sen', 'INSTITUTION_ADMIN', 2, 'Registrar & Authorized Signatory', '+91 98290 67890', 'Active'),
(6, 'admin@vjti.ac.in', '$2a$10$99x.Y8U7I6O5P4A3S2D1fe.1a2s3d4f5g6h7j8k9l0z1x2c3v4b', 'Dr. Sanjay Deshmukh', 'INSTITUTION_ADMIN', 3, 'Principal & Head of Institute', '+91 98200 45678', 'Active')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);
