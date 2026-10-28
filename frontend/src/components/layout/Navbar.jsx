import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import FdrVaultLogo from '../common/FdrVaultLogo';
import {
  Bell,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Building,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'VERIFICATION_OFFICER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INSTITUTION_ADMIN':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatRoleLabel = (r) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'AICTE Admin';
      case 'VERIFICATION_OFFICER':
        return 'AICTE Officer';
      case 'INSTITUTION_ADMIN':
        return 'College Admin';
      default:
        return r?.replace('_', ' ').toLowerCase();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left Side: Mobile Menu Button & FDRvault Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center group">
            <FdrVaultLogo size="md" showTagline={true} theme="light" />
          </Link>
        </div>

        {/* Right Side: Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Institution Tag (if College Admin) */}
          {user?.institutionName && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200 text-xs text-slate-700 max-w-xs truncate">
              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate font-medium">{user.institutionName}</span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); setDemoMenuOpen(false); }}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-modal border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">System Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-[#2563EB] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link_url) {
                            setNotifOpen(false);
                            navigate(n.link_url);
                          }
                        }}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                          n.is_read ? 'opacity-70 bg-white' : 'bg-royal-50/40 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    View All Notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#12345A] text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-500/30">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-[#2563EB] font-medium">{formatRoleLabel(role)}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-modal border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadge(role)}`}>
                      {formatRoleLabel(role)}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Account Profile</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
