import React from 'react';
import { Bell } from 'lucide-react';

interface NavbarProps {
  alertCount: number;
  onOpenNotifications: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  alertCount,
  onOpenNotifications,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <button
            onClick={() => onNavigate('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>BreezeSG</span>
            <span className="text-xs font-normal text-slate-400 font-mono tracking-normal">Singapore PSI</span>
          </button>

          {/* Zone 2: 4–5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('overview')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'overview' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('map')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'map' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => onNavigate('regional')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'regional' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Regional PSI
            </button>
            <button
              onClick={() => onNavigate('guidelines')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'guidelines' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Health Advice
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'alerts' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Alert Rules
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNotifications}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full font-mono text-[10px] font-bold">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
