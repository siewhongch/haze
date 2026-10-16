import React from 'react';
import { AlertLogItem } from '../types/psi';
import { X, Trash2, Bell, AlertTriangle, ShieldCheck, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertLogItem[];
  onClearAlerts: () => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                Push Alert Log
              </h2>
              {alerts.length > 0 && (
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAlerts}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Clear all alerts"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  No Alerts Triggered
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  All Singapore regions are currently operating within your healthy PSI thresholds.
                </p>
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    item.severity === 'critical'
                      ? 'border-rose-200 bg-rose-50/50'
                      : item.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 ${
                          item.severity === 'critical'
                            ? 'text-rose-600'
                            : item.severity === 'warning'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-900 capitalize">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-2">
                    <span className="capitalize">Region: {item.region}</span>
                    <span className="font-mono font-medium text-slate-700">
                      Reading: {item.psiValue} {item.metricType}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Stored locally on this device
              </span>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-slate-900 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Dismiss All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
