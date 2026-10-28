import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const formatSegment = (seg) => {
    if (!isNaN(seg)) return `#${seg}`;
    return seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 sm:space-x-2">
        <li className="inline-flex items-center">
          <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium">
            <Home className="w-3.5 h-3.5 mr-1" />
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {isLast ? (
                <span className="font-semibold text-slate-800">{formatSegment(value)}</span>
              ) : (
                <Link to={to} className="hover:text-slate-900 font-medium">
                  {formatSegment(value)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
