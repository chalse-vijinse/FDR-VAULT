import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FdrVaultLogo from '../common/FdrVaultLogo';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  ShieldCheck,
  ArrowUpRight,
  Bell,
  BarChart3,
  History,
  Users2,
  Settings,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role, user } = useAuth();

  // Navigation Items with role-based visibility
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: role === 'INSTITUTION_ADMIN' ? 'College Profile' : 'Colleges & Institutes',
      path: role === 'INSTITUTION_ADMIN' ? `/institutions/${user?.institutionId || ''}` : '/institutions',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: 'FDR Portfolio',
      path: '/fdr',
      icon: FileCheck2,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: 'Verification Queue',
      path: '/verifications',
      icon: ShieldCheck,
      badge: 'Action',
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER']
    },
    {
      name: 'Release Requests',
      path: '/release-requests',
      icon: ArrowUpRight,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    },
    {
      name: 'Audit Activity',
      path: '/audit-logs',
      icon: History,
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'User Management',
      path: '/users',
      icon: Users2,
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'System Settings',
      path: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN']
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  const formatRoleLabel = (r) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'AICTE Admin Portal';
      case 'VERIFICATION_OFFICER':
        return 'AICTE Officer Portal';
      case 'INSTITUTION_ADMIN':
        return 'College Portal';
      default:
        return 'FDR Portal';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#12345A] text-slate-300 flex flex-col border-r border-[#0e2a4a] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding with FDRvault Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1b436f] bg-[#0c2440]/60">
          <FdrVaultLogo size="sm" showTagline={false} theme="dark" />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Designation Pill */}
        <div className="px-4 pt-3 pb-1">
          <div className="px-2.5 py-1 rounded-md bg-[#18406c] border border-blue-400/20 text-[10px] font-semibold text-teal-300 flex items-center justify-between">
            <span>{formatRoleLabel(role)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Navigation Menu
          </div>

          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm font-semibold border-l-3 border-teal-400 pl-2.5'
                    : 'text-slate-200 hover:text-white hover:bg-[#1a436f]'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <item.icon className="w-4 h-4 shrink-0 transition-colors opacity-80 group-hover:opacity-100" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Institutional Info Badge */}
        <div className="p-3 m-3 rounded-xl bg-[#0c2440]/80 border border-[#1b436f] text-[11px]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Authenticated Session</span>
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </div>
          <p className="font-semibold text-white truncate">{user?.fullName || 'User'}</p>
          <p className="text-[10px] text-teal-300 capitalize truncate mt-0.5">
            {user?.institutionName || role?.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </aside>
    </>
  );
}
