import { AlertRule, AlertLogItem, PSIResponse, SingaporeRegion } from '../types/psi';
import { getBandDetails, getPSIBand } from './neaService';

const STORAGE_KEY_ALERTS = 'breezesg_alerts_history';
const STORAGE_KEY_SETTINGS = 'breezesg_alert_rules';

export const DEFAULT_ALERT_RULE: AlertRule = {
  id: 'rule_default',
  enabled: true,
  thresholdPsi: 100, // Unhealthy threshold as per NEA
  targetRegion: 'all',
  triggerOnPm25Spike: true,
  pm25Threshold: 55, // 1-hour PM2.5 Band II elevated threshold
  soundEnabled: true,
  browserPushEnabled: true,
};

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request permission from the user for desktop push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Play a synthesized warning tone using Web Audio API (safe, no external mp3 required)
 */
export function playAlertChime(severity: 'moderate' | 'warning' | 'critical' = 'warning') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (severity === 'critical') {
      // 3 ascending warning pulses
      [0, 0.18, 0.36].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 2 ? 880 : 660, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } else {
      // Double pleasant chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {
    console.debug('Web audio autoplay prevented:', err);
  }
}

/**
 * Dispatch desktop push notification and record in history
 */
export function sendPushNotification(
  title: string,
  body: string,
  region: SingaporeRegion,
  psiValue: number,
  severity: 'moderate' | 'warning' | 'critical' = 'warning',
  soundEnabled = true
): AlertLogItem {
  if (soundEnabled) {
    playAlertChime(severity);
  }

  // Attempt real browser notification
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `breezesg-alert-${region}-${Date.now()}`,
        badge: '/favicon.ico',
      });
    } catch (e) {
      console.warn('Native notification failed, saved to in-app notification center:', e);
    }
  }

  const alertItem: AlertLogItem = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    region,
    psiValue,
    threshold: 100,
    metricType: 'PSI',
    title,
    message: body,
    severity,
    read: false,
  };

  saveAlertToStorage(alertItem);
  return alertItem;
}

export function loadAlertsFromStorage(): AlertLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAlertToStorage(item: AlertLogItem) {
  try {
    const current = loadAlertsFromStorage();
    const updated = [item, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save alert to storage:', err);
  }
}

export function clearAlertHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY_ALERTS);
  } catch (err) {
    console.warn(err);
  }
}

export function loadAlertRule(): AlertRule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_ALERT_RULE;
    return { ...DEFAULT_ALERT_RULE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALERT_RULE;
  }
}

export function saveAlertRule(rule: AlertRule) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(rule));
  } catch (err) {
    console.warn(err);
  }
}

// Track last alerted timestamp per region to avoid notification spam
const lastAlertedTimes: Partial<Record<SingaporeRegion, number>> = {};

/**
 * Evaluates live readings against user's alert rules
 */
export function evaluateReadingsForAlerts(
  response: PSIResponse,
  rule: AlertRule,
  forceCheck = false
): AlertLogItem[] {
  if (!rule.enabled) return [];

  const now = Date.now();
  const cooldownMs = forceCheck ? 0 : 30 * 60 * 1000; // 30 min cooldown per region
  const triggered: AlertLogItem[] = [];

  const regionsToCheck: SingaporeRegion[] = rule.targetRegion === 'all'
    ? ['national', 'central', 'north', 'south', 'east', 'west']
    : [rule.targetRegion];

  for (const reg of regionsToCheck) {
    const data = response.regions[reg];
    if (!data) continue;

    const lastAlerted = lastAlertedTimes[reg] || 0;
    if (!forceCheck && now - lastAlerted < cooldownMs) {
      continue;
    }

    // Check PSI threshold
    if (data.psi >= rule.thresholdPsi) {
      const band = getPSIBand(data.psi);
      const bandInfo = getBandDetails(band);
      const severity = data.psi >= 200 ? 'critical' : data.psi >= 100 ? 'warning' : 'moderate';

      const title = `Air Quality Alert: ${data.displayName} PSI ${data.psi} (${bandInfo.label})`;
      const message = `${data.displayName} air quality has breached your threshold of ${rule.thresholdPsi}. ${bandInfo.generalPublicAdvice}`;

      const alert = sendPushNotification(title, message, reg, data.psi, severity, rule.soundEnabled);
      lastAlertedTimes[reg] = now;
      triggered.push(alert);
      continue;
    }

    // Check 1-hr PM2.5 spike threshold
    if (rule.triggerOnPm25Spike && data.pm25_1h >= rule.pm25Threshold) {
      const title = `1-Hr PM2.5 Spike: ${data.displayName} at ${data.pm25_1h} µg/m³`;
      const message = `High concentration of fine particulate matter detected in ${data.displayName}. Reduce intense outdoor sports.`;
      const severity = data.pm25_1h >= 150 ? 'critical' : 'warning';

      const alert = sendPushNotification(title, message, reg, data.pm25_1h, severity, rule.soundEnabled);
      lastAlertedTimes[reg] = now;
      triggered.push(alert);
    }
  }

  return triggered;
}
