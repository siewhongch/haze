import React, { useState, useEffect, useCallback } from 'react';
import {
  SingaporeRegion,
  PSIResponse,
  AlertRule,
  AlertLogItem,
  PresetScenario,
  HourlyForecastItem,
} from './types/psi';
import {
  fetchLiveNEAData,
  getSyntheticScenario,
  generateHourlyTrends,
} from './services/neaService';
import {
  DEFAULT_ALERT_RULE,
  loadAlertRule,
  saveAlertRule,
  loadAlertsFromStorage,
  clearAlertHistory,
  evaluateReadingsForAlerts,
  sendPushNotification,
} from './services/notificationService';
import { Navbar } from './components/Navbar';
import { HeroOverview } from './components/HeroOverview';
import { InteractiveMap } from './components/InteractiveMap';
import { RegionalCards } from './components/RegionalCards';
import { HealthAdvisories } from './components/HealthAdvisories';
import { PollutantAnalytics } from './components/PollutantAnalytics';
import { AlertsManager } from './components/AlertsManager';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Bell, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<PSIResponse>(() => getSyntheticScenario('live_baseline'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<PresetScenario | 'live_api'>('live_api');
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('national');
  const [metricMode, setMetricMode] = useState<'psi' | 'pm25'>('psi');
  const [alertRule, setAlertRule] = useState<AlertRule>(() => loadAlertRule());
  const [alertHistory, setAlertHistory] = useState<AlertLogItem[]>(() => loadAlertsFromStorage());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [hourlyTrends, setHourlyTrends] = useState<HourlyForecastItem[]>(() => generateHourlyTrends(38));
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string; severity: string } | null>(null);

  // Load live data or scenario
  const loadData = useCallback(async (scenario: PresetScenario | 'live_api') => {
    setIsLoading(true);
    try {
      let res: PSIResponse;
      if (scenario === 'live_api') {
        res = await fetchLiveNEAData();
      } else {
        res = getSyntheticScenario(scenario);
      }
      setData(res);
      setHourlyTrends(generateHourlyTrends(res.nationalAverage));

      // Evaluate new readings against alert thresholds
      const triggered = evaluateReadingsForAlerts(res, alertRule, false);
      if (triggered.length > 0) {
        setAlertHistory((prev) => [...triggered, ...prev]);
        setToastMessage({
          title: triggered[0].title,
          body: triggered[0].message,
          severity: triggered[0].severity,
        });
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch (e) {
      console.error('Failed to load air quality data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [alertRule]);

  // Initial load
  useEffect(() => {
    loadData(activeScenario);
    // Poll every 60 seconds
    const interval = setInterval(() => {
      loadData(activeScenario);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData, activeScenario]);

  // Scenario change handler
  const handleSelectScenario = (scenario: PresetScenario | 'live_api') => {
    setActiveScenario(scenario);
    loadData(scenario);
  };

  // Rule update handler
  const handleUpdateRule = (updated: AlertRule) => {
    setAlertRule(updated);
    saveAlertRule(updated);
  };

  // Immediate simulated alert trigger (for demonstration & testing)
  const handleTriggerSimulatedAlert = (severity: 'warning' | 'critical') => {
    const psiVal = severity === 'critical' ? 220 : 138;
    const reg: SingaporeRegion = alertRule.targetRegion === 'all' ? 'west' : alertRule.targetRegion;
    const title = severity === 'critical'
      ? `CRITICAL ALERT: Very Unhealthy Air Quality in ${reg.toUpperCase()} (PSI ${psiVal})`
      : `AIR QUALITY WARNING: ${reg.toUpperCase()} Exceeded PSI ${alertRule.thresholdPsi}`;
    const body = severity === 'critical'
      ? 'Air pollution poses serious health risks. Strictly avoid outdoor exercise and seal windows.'
      : 'Prolonged outdoor physical exertion should be reduced immediately according to NEA guidelines.';

    const newAlert = sendPushNotification(title, body, reg, psiVal, severity, alertRule.soundEnabled);
    setAlertHistory((prev) => [newAlert, ...prev]);

    // Also update current active scenario to show the spike visually!
    if (severity === 'critical') {
      handleSelectScenario('very_unhealthy');
    } else {
      handleSelectScenario('unhealthy_haze');
    }

    setToastMessage({
      title,
      body,
      severity,
    });
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleClearAlerts = () => {
    clearAlertHistory();
    setAlertHistory([]);
  };

  const handleMarkAllRead = () => {
    setAlertHistory((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const unreadAlertCount = alertHistory.filter((a) => !a.read).length;
  const currentRegionData = data.regions[selectedRegion] || data.regions.national;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-200">
      {/* 3-Zone Top Bar Contract Navigation */}
      <Navbar
        alertCount={unreadAlertCount}
        onOpenNotifications={() => setIsDrawerOpen(true)}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Floating Push Alert Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-xl shadow-2xl p-4 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 mb-0.5">
                {toastMessage.title}
              </div>
              <p className="text-xs text-slate-600 leading-snug">
                {toastMessage.body}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  View Alert History
                </button>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Section 1: Hero Overview & Key Numbers */}
        <section id="overview" className="scroll-mt-20">
          <HeroOverview
            data={data}
            isLoading={isLoading}
            onRefresh={() => loadData(activeScenario)}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </section>

        {/* Section 2: Interactive Singapore Air Quality Map */}
        <section id="map" className="scroll-mt-20">
          <InteractiveMap
            data={data}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            metricMode={metricMode}
            onChangeMetric={setMetricMode}
          />
        </section>

        {/* Section 3: 5 Official Regional Monitoring Stations */}
        <section id="regional" className="scroll-mt-20">
          <RegionalCards
            data={data}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </section>

        {/* Section 4: NEA & MOH Health Advisories */}
        <section id="guidelines" className="scroll-mt-20">
          <HealthAdvisories regionData={currentRegionData} />
        </section>

        {/* Section 5: Pollutant Analytics & 24-Hour Trend */}
        <section id="pollutants" className="scroll-mt-20">
          <PollutantAnalytics
            regionData={currentRegionData}
            hourlyTrends={hourlyTrends}
          />
        </section>

        {/* Section 6: Push Notifications & Threshold Alerts */}
        <section id="alerts" className="scroll-mt-20">
          <AlertsManager
            rule={alertRule}
            onUpdateRule={handleUpdateRule}
            onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
            recentAlertCount={unreadAlertCount}
            onOpenNotificationCenter={() => setIsDrawerOpen(true)}
          />
        </section>
      </main>

      {/* Slide-over Notification History Drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        alerts={alertHistory}
        onClearAlerts={handleClearAlerts}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">BreezeSG</span>
            <span aria-hidden="true">·</span>
            <span>Singapore Air Quality & PSI Live Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Public Open Data by GovTech SG & National Environment Agency</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://data.gov.sg/datasets/d_ea081198539fb04bb5bc4f4949216093/view"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <span>NEA API Reference</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => scrollToSection('alerts')}
              className="hover:text-slate-900 transition-colors"
            >
              Configure Push Alerts
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
