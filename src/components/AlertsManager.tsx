import React, { useState } from 'react';
import { AlertRule, SingaporeRegion, AlertLogItem } from '../types/psi';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  playAlertChime,
} from '../services/notificationService';
import { Bell, BellRing, Volume2, VolumeX, ShieldAlert, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

interface AlertsManagerProps {
  rule: AlertRule;
  onUpdateRule: (updated: AlertRule) => void;
  onTriggerSimulatedAlert: (severity: 'warning' | 'critical') => void;
  recentAlertCount: number;
  onOpenNotificationCenter: () => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  rule,
  onUpdateRule,
  onTriggerSimulatedAlert,
  recentAlertCount,
  onOpenNotificationCenter,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendPushNotification(
        'BreezeSG Notifications Enabled',
        'You will now receive instant push alerts whenever Singapore air quality crosses your threshold.',
        'national',
        42,
        'moderate',
        rule.soundEnabled
      );
      setTestSentMessage('Push notifications enabled successfully!');
      setTimeout(() => setTestSentMessage(null), 4000);
    }
  };

  const handleSendTestPush = () => {
    sendPushNotification(
      'Test Alert: Singapore Air Quality',
      `BreezeSG test alert: Current PSI threshold is set to ${rule.thresholdPsi}. Push notification delivery verified.`,
      rule.targetRegion === 'all' ? 'national' : rule.targetRegion,
      rule.thresholdPsi + 5,
      'warning',
      rule.soundEnabled
    );
    setTestSentMessage('Test push notification dispatched!');
    setTimeout(() => setTestSentMessage(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-700" />
            Push Notification & Threshold Alerts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure custom thresholds to receive instant desktop and mobile browser push notifications when air quality drops.
          </p>
        </div>

        {/* Status Badge & Notification Center Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotificationCenter}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alert History</span>
            {recentAlertCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-rose-600 text-white rounded-full">
                {recentAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Permission Status Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {permission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : permission === 'denied' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Bell className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>Browser Push Notifications:</span>
                <span className={`text-xs font-medium capitalize ${
                  permission === 'granted' ? 'text-emerald-700' : permission === 'denied' ? 'text-rose-700' : 'text-slate-600'
                }`}>
                  {permission === 'granted' ? 'Active & Ready' : permission === 'denied' ? 'Blocked in Browser' : 'Not Yet Enabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {permission === 'granted'
                  ? 'Your browser is authorized to display notifications even when BreezeSG is in the background.'
                  : permission === 'denied'
                  ? 'Notifications are blocked in your browser settings. Please unlock permissions in your address bar.'
                  : 'Grant browser permission to receive live air quality threshold alerts on your screen.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Enable Push Notifications
              </button>
            ) : (
              <button
                onClick={handleSendTestPush}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Send Test Push
              </button>
            )}
          </div>
        </div>

        {testSentMessage && (
          <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            {testSentMessage}
          </div>
        )}

        {/* Alert Rule Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: PSI Threshold & Target Region */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Trigger Alert When 24-Hr PSI Exceeds:
                </label>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {rule.thresholdPsi} PSI
                </span>
              </div>

              {/* Threshold Preset Selectors */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { label: '50 (Mod)', val: 50 },
                  { label: '75 (Mid)', val: 75 },
                  { label: '100 (Unhealthy)', val: 100 },
                  { label: '150 (Severe)', val: 150 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onUpdateRule({ ...rule, thresholdPsi: item.val })}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors ${
                      rule.thresholdPsi === item.val
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={rule.thresholdPsi}
                onChange={(e) => onUpdateRule({ ...rule, thresholdPsi: Number(e.target.value) })}
                className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>40 (Sensitive)</span>
                <span>100 (NEA Unhealthy)</span>
                <span>200 (Very Unhealthy)</span>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Monitoring Region:
              </label>
              <select
                value={rule.targetRegion}
                onChange={(e) =>
                  onUpdateRule({
                    ...rule,
                    targetRegion: e.target.value as SingaporeRegion | 'all',
                  })
                }
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">Islandwide (Alert for any of the 5 regions)</option>
                <option value="west">West (Jurong, Tuas, Clementi)</option>
                <option value="central">Central (Bishan, Toa Payoh, Novena)</option>
                <option value="south">South (Marina Bay, Sentosa, Telok Blangah)</option>
                <option value="east">East (Changi, Tampines, Bedok)</option>
                <option value="north">North (Woodlands, Yishun, Sembawang)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Choose whether to monitor your residential area specifically or islandwide haze events.
              </p>
            </div>
          </div>

          {/* Right Column: PM2.5 Spike & Audio Toggles */}
          <div className="space-y-4">
            {/* PM2.5 1-Hr Spike Alert */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-semibold text-slate-900">
                    1-Hour PM2.5 Spike Alert
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.triggerOnPm25Spike}
                    onChange={(e) =>
                      onUpdateRule({ ...rule, triggerOnPm25Spike: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Instantly notify when localized fine particulate levels cross 55 µg/m³ (Band II Elevated), even if 24-hr PSI has not yet updated.
              </p>
            </div>

            {/* Sound Chime Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rule.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-slate-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-900">
                    Audible Alert Chime
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.soundEnabled}
                    onChange={(e) =>
                      onUpdateRule({ ...rule, soundEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Play an acoustic tone when an unhealthy air quality threshold is crossed.
              </p>
            </div>

            {/* Simulated Haze Spike Simulator */}
            <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-700" />
                  <span>Simulate Threshold Alert</span>
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  Test alert triggers and health advice workflows.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTriggerSimulatedAlert('warning')}
                  className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                >
                  Unhealthy (PSI 138)
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerSimulatedAlert('critical')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
                >
                  Severe (PSI 220)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Serverless Backend Connection Blueprint */}
        <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>Serverless Backend Architecture Spec</span>
            </h3>
            <span className="font-mono text-[11px] text-slate-500">Ready for Backend Integration</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            When connecting your serverless backend (Cloud Functions, AWS Lambda, or Vercel Edge), schedule a cron to poll the official Singapore NEA API and dispatch Web Push payloads:
          </p>

          <div className="bg-slate-900 rounded-lg p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto">
            <pre className="whitespace-pre">
{`// Serverless Cron (Runs every 10 min): Cloud Function / Lambda
const res = await fetch("https://api.data.gov.sg/v1/environment/psi");
const data = await res.json();
const latestPsi = data.items[0].readings.psi_twenty_four_hourly;

// Check user threshold (e.g., PSI >= ${rule.thresholdPsi} for ${rule.targetRegion.toUpperCase()})
if (latestPsi["${rule.targetRegion === 'all' ? 'national' : rule.targetRegion}"] >= ${rule.thresholdPsi}) {
  await webPush.sendNotification(userSubscription, JSON.stringify({
    title: "Air Quality Alert: Singapore PSI Exceeded",
    body: "PSI reached " + latestPsi["${rule.targetRegion === 'all' ? 'national' : rule.targetRegion}"] + " in ${rule.targetRegion}",
    icon: "/favicon.ico"
  }));
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
