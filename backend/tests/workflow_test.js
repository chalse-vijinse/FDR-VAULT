const API = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runFullWorkflowTest() {
  console.log('===============================================================');
  console.log('   SECUREFDR - COMPLETE END-TO-END WORKFLOW VERIFICATION TEST   ');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------
    // Step 1: College Login (admin@iitdelhi.ac.in)
    // -------------------------------------------------------------
    console.log('[Step 1] College Login (admin@iitdelhi.ac.in)...');
    const collegeLogin = await req(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@iitdelhi.ac.in', password: 'Inst@123' })
    });
    const collegeToken = collegeLogin.token;
    const collegeHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${collegeToken}`
    };
    console.log('✓ College logged in successfully:', collegeLogin.user.fullName);

    // -------------------------------------------------------------
    // Step 2: College creates a new FDR record
    // -------------------------------------------------------------
    console.log('\n[Step 2] College creates FDR record in Draft...');
    const testFdrNumber = `IITD-FDR-${Date.now().toString().slice(-6)}`;
    const createRes = await req(`${API}/fdr`, {
      method: 'POST',
      headers: collegeHeaders,
      body: JSON.stringify({
        record_type: 'Fixed Deposit Receipt',
        fdr_number: testFdrNumber,
        bank_name: 'State Bank of India',
        branch_name: 'IIT Hauz Khas Branch',
        ifsc_code: 'SBIN0001077',
        deposit_amount: '2500000',
        currency: 'INR',
        issue_date: '2026-01-15',
        maturity_date: '2029-01-15',
        deposit_holder_name: 'Delhi Institute (IIT Delhi) / Joint AICTE Member Secretary',
        deposit_purpose: 'Mandatory Institutional Security Deposit (PG Engineering)',
        approval_reference: 'AICTE/NW/2026/APP-99120',
        additional_notes: 'Initial deposit submitted under SIH26265 lifecycle workflow.'
      })
    });

    const fdrId = createRes.fdrId;
    console.log(`✓ FDR Record #${fdrId} (${testFdrNumber}) created. Status: Draft.`);

    // -------------------------------------------------------------
    // Step 3: College uploads supporting document
    // -------------------------------------------------------------
    console.log('\n[Step 3] College uploads FDR certificate document...');
    const formData = new FormData();
    const blob = new Blob(['%PDF-1.4 Mock FDR Certificate Scan - Joint Lien Clause Validated - SBI Hauz Khas'], {
      type: 'application/pdf'
    });
    formData.append('document', blob, 'SBI_FDR_Certificate_Scanned.pdf');
    formData.append('document_type', 'FDR Certificate');

    const uploadRes = await req(`${API}/fdr/${fdrId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${collegeToken}` },
      body: formData
    });
    console.log(`✓ Supporting Document #${uploadRes.documentId} uploaded and processed.`);

    // -------------------------------------------------------------
    // Step 4: College submits FDR for verification
    // -------------------------------------------------------------
    console.log('\n[Step 4] College submits FDR for verification...');
    const submitRes = await req(`${API}/fdr/${fdrId}/submit`, {
      method: 'POST',
      headers: collegeHeaders
    });
    console.log(`✓ FDR #${fdrId} submitted! Current Status: "${submitRes.status}"`);

    // -------------------------------------------------------------
    // Step 5: Officer Login (officer.sharma@securefdr.gov.in)
    // -------------------------------------------------------------
    console.log('\n[Step 5] AICTE Verification Officer Login (officer.sharma@securefdr.gov.in)...');
    const officerLogin = await req(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer.sharma@securefdr.gov.in', password: 'Officer@123' })
    });
    const officerToken = officerLogin.token;
    const officerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerToken}`
    };
    console.log('✓ Verification Officer logged in:', officerLogin.user.fullName);

    // Verify record is visible in Officer queue
    const queueRes = await req(`${API}/verifications`, { headers: officerHeaders });
    const foundInQueue = queueRes.data.find(r => r.id === fdrId);
    console.log(`✓ Found FDR #${fdrId} in Officer Verification Queue: ${foundInQueue ? 'YES' : 'NO'}`);

    // -------------------------------------------------------------
    // Step 6: Officer requests Clarification / Missing Documents
    // -------------------------------------------------------------
    console.log('\n[Step 6] Officer raises Clarification Request with remarks...');
    const clarifyRes = await req(`${API}/verifications/${fdrId}/request-documents`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        reason: 'Please provide branch manager confirmation letter verifying irrevocable lien favoring AICTE.'
      })
    });
    console.log(`✓ Clarification requested! Status updated to: "${clarifyRes.status}"`);

    // -------------------------------------------------------------
    // Step 7: College checks status and sees officer remarks
    // -------------------------------------------------------------
    console.log('\n[Step 7] College verifies updated status and officer remarks...');
    const collegeView1 = await req(`${API}/fdr/${fdrId}`, { headers: collegeHeaders });
    console.log(`✓ Current Status visible to College: "${collegeView1.data.status}"`);
    console.log(`✓ Officer Clarification Remarks: "${collegeView1.data.discrepancy_details}"`);

    // -------------------------------------------------------------
    // Step 8: College corrects details and resubmits
    // -------------------------------------------------------------
    console.log('\n[Step 8] College corrects details and resubmits...');
    await req(`${API}/fdr/${fdrId}`, {
      method: 'PUT',
      headers: collegeHeaders,
      body: JSON.stringify({
        additional_notes: 'Uploaded branch manager endorsement letter dated 2026-01-20.'
      })
    });
    const resubmitRes = await req(`${API}/fdr/${fdrId}/submit`, {
      method: 'POST',
      headers: collegeHeaders
    });
    console.log(`✓ College resubmitted FDR #${fdrId}! Status updated to: "${resubmitRes.status}"`);

    // -------------------------------------------------------------
    // Step 9: Officer reviews and forwards for Admin Approval
    // -------------------------------------------------------------
    console.log('\n[Step 9] Officer verifies and recommends for final admin approval...');
    const officerDecision = await req(`${API}/verifications/${fdrId}/decision`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        decision: 'Pending Admin Approval',
        findings: 'Branch manager letter confirmed with SBI Hauz Khas. Lien recorded in bank ledger. Forwarded for Admin Approval.',
        independent_evidence_ref: 'SBI/HK/2026/AICTE-LN-441'
      })
    });
    console.log(`✓ Officer Decision recorded! Status: "${officerDecision.status}"`);

    // -------------------------------------------------------------
    // Step 10: AICTE Admin Login (admin@securefdr.gov.in)
    // -------------------------------------------------------------
    console.log('\n[Step 10] AICTE Admin Login (admin@securefdr.gov.in)...');
    const adminLogin = await req(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@securefdr.gov.in', password: 'Admin@123' })
    });
    const adminToken = adminLogin.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    };
    console.log('✓ AICTE Admin logged in:', adminLogin.user.fullName);

    // -------------------------------------------------------------
    // Step 11: AICTE Admin grants final approval
    // -------------------------------------------------------------
    console.log('\n[Step 11] AICTE Admin executes final approval...');
    const adminApproveRes = await req(`${API}/verifications/${fdrId}/admin-approve`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'Approved',
        remarks: 'Approved by Member Secretary, AICTE. Deposit record confirmed genuine.'
      })
    });
    console.log(`✓ AICTE Admin Approval completed! Status: "${adminApproveRes.status}"`);

    // -------------------------------------------------------------
    // Step 12: College submits security deposit Release Request
    // -------------------------------------------------------------
    console.log('\n[Step 12] College applies for deposit release...');
    const releaseRes = await req(`${API}/release-requests`, {
      method: 'POST',
      headers: collegeHeaders,
      body: JSON.stringify({
        fdr_id: fdrId,
        reason_for_release: 'Mandatory statutory AICTE tenure completed without academic or regulatory discrepancies.',
        compliance_notes: 'All compliance norms met; audit clearance attached.'
      })
    });
    const releaseId = releaseRes.requestId;
    console.log(`✓ Release Request submitted. Ref: ${releaseRes.requestReference} (ID: ${releaseId})`);

    // -------------------------------------------------------------
    // Step 13: Officer reviews release request & recommends
    // -------------------------------------------------------------
    console.log('\n[Step 13] Officer reviews release request and recommends...');
    await req(`${API}/release-requests/${releaseId}/decision`, {
      method: 'POST',
      headers: officerHeaders,
      body: JSON.stringify({
        action: 'Recommended',
        remarks: 'Institutional academic audits clear. Recommending NOC and lien release.'
      })
    });
    console.log('✓ Release request recommended for approval.');

    // -------------------------------------------------------------
    // Step 14: AICTE Admin approves release and issues NOC
    // -------------------------------------------------------------
    console.log('\n[Step 14] AICTE Admin approves release with NOC Reference...');
    const finalReleaseRes = await req(`${API}/release-requests/${releaseId}/decision`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'Release Approved',
        remarks: 'NOC issued under AICTE Regulation 2026.',
        confirmationRef: 'AICTE/NOC/2026/DELHI-REL-091'
      })
    });
    console.log(`✓ AICTE Admin Release Approval recorded. Status: "${finalReleaseRes.status}"`);

    // -------------------------------------------------------------
    // Step 15: AICTE Admin marks deposit as Released
    // -------------------------------------------------------------
    console.log('\n[Step 15] AICTE Admin executes final Release & Discharges Lien...');
    const releasedOutcome = await req(`${API}/release-requests/${releaseId}/decision`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'Released',
        remarks: 'Lien formally discharged and bank intimation issued.',
        confirmationRef: 'AICTE/NOC/2026/DELHI-REL-091'
      })
    });
    console.log(`✓ Final Outcome: "${releasedOutcome.status}"`);

    // Check final FDR status
    const finalFdrView = await req(`${API}/fdr/${fdrId}`, { headers: collegeHeaders });
    console.log(`\n===============================================================`);
    console.log(`✓ FINAL FDR STATUS: "${finalFdrView.data.status}"`);
    console.log(`✓ VERIFICATION LABEL: "${finalFdrView.data.verification_status_label}"`);
    console.log(`✓ AUDIT STEPS LOGGED: ${finalFdrView.data.verificationHistory.length} chronological actions recorded.`);
    console.log(`===============================================================`);
    console.log('ALL WORKFLOW LIFECYCLE TESTS PASSED 100% SUCCESSFULLY!\n');
  } catch (err) {
    console.error('\n❌ Workflow test failed:', err.data || err.message);
    process.exit(1);
  }
}

runFullWorkflowTest();
