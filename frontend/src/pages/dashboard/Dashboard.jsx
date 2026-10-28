import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import OfficerDashboard from './OfficerDashboard';
import InstitutionDashboard from './InstitutionDashboard';

export default function Dashboard() {
  const { role } = useAuth();

  if (role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  if (role === 'VERIFICATION_OFFICER') {
    return <OfficerDashboard />;
  }

  return <InstitutionDashboard />;
}
