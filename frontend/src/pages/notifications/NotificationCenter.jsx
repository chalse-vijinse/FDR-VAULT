import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {
  Bell,
  CheckCheck,
  Calendar,
  AlertTriangle,
  FileQuestion,
  FileCheck2,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState('All');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const navigate = useNavigate();

  const notificationTypes = [
    'All',
    'MATURITY_ALERT',
    'MISSING_DOCUMENT',
    'VERIFICATION_ASSIGNMENT',
    'VERIFICATION_COMPLETED',
    'RELEASE_UPDATE',
    'SYSTEM'
  ];

  const filteredNotifs = notifications.filter(n => {
    if (filterUnreadOnly && n.is_read) return false;
    if (filterType !== 'All' && n.type !== filterType) return false;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'MATURITY_ALERT':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'MISSING_DOCUMENT':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      case 'VERIFICATION_ASSIGNMENT':
      case 'VERIFICATION_COMPLETED':
        return <FileCheck2 className="w-5 h-5 text-royal-600" />;
      case 'RELEASE_UPDATE':
        return <ArrowUpRight className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Institutional Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maturity reminders, verification tasks, missing document alerts, and release updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-sm transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
          >
            {notificationTypes.map((t) => (
              <option key={t} value={t}>Type: {t.replace('_', ' ')}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded border-slate-300 text-royal-600 focus:ring-royal-500 h-4 w-4"
            />
            <span>Show Unread Only ({unreadCount})</span>
          </label>
        </div>

        <div className="text-slate-400">
          Showing {filteredNotifs.length} Alerts
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            title="No Notifications Found"
            description="You are caught up with all institutional alerts and compliance notices."
          />
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${
                n.is_read
                  ? 'bg-white border-slate-200/80'
                  : 'bg-royal-50/40 border-royal-200 shadow-2xs ring-1 ring-royal-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-slate-900">{n.title}</h2>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-royal-600 inline-block" />
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400">
                        {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {n.link_url && (
                        <button
                          onClick={() => {
                            markAsRead(n.id);
                            navigate(n.link_url);
                          }}
                          className="font-semibold text-royal-600 hover:text-royal-800 hover:underline inline-flex items-center gap-1"
                        >
                          Navigate to Record &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-white whitespace-nowrap"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
