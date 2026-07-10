import { Platform } from 'react-native';
import { app } from '../firebase';

let enabled = true;
let nativeAnalytics;
let webAnalytics;
let webInitPromise;
let webModulePromise;
let errorHandlersInstalled = false;

function trimString(v, max) {
  const s = String(v ?? '');
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function toParamValue(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return trimString(JSON.stringify(v), 100);
}

function sanitizeParams(params) {
  const out = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (!k) return;
    const value = toParamValue(v);
    if (value === undefined) return;
    out[k] = value;
  });
  return out;
}

function getNativeAnalytics() {
  if (Platform.OS === 'web') return null;
  if (nativeAnalytics !== undefined) return nativeAnalytics;
  try {
    const mod = require('@react-native-firebase/analytics');
    nativeAnalytics = typeof mod?.default === 'function' ? mod.default() : null;
    return nativeAnalytics;
  } catch {
    nativeAnalytics = null;
    return null;
  }
}

async function getWebModule() {
  if (Platform.OS !== 'web') return null;
  if (!webModulePromise) {
    webModulePromise = import('firebase/analytics').catch(() => null);
  }
  return webModulePromise;
}

async function getWebAnalytics() {
  if (Platform.OS !== 'web') return null;
  if (!app?.options?.measurementId) return null;
  if (webAnalytics) return webAnalytics;
  if (!webInitPromise) {
    webInitPromise = (async () => {
      const mod = await getWebModule();
      if (!mod?.isSupported || !mod?.getAnalytics) return null;
      const ok = await mod.isSupported().catch(() => false);
      if (!ok) return null;
      webAnalytics = mod.getAnalytics(app);
      return webAnalytics;
    })().catch(() => null);
  }
  return webInitPromise;
}

export function setAnalyticsEnabled(v) {
  enabled = !!v;
}

export async function trackEvent(name, params) {
  if (!enabled || !name) return;
  const safeParams = sanitizeParams(params);

  const native = getNativeAnalytics();
  if (native?.logEvent) {
    try {
      await native.logEvent(name, safeParams);
    } catch {}
    return;
  }

  const web = await getWebAnalytics();
  if (!web) return;
  const mod = await getWebModule();
  if (!mod?.logEvent) return;
  try {
    await mod.logEvent(web, name, safeParams);
  } catch {}
}

export async function trackScreen(screenName, params) {
  if (!enabled || !screenName) return;
  const name = trimString(screenName, 100);
  const safeParams = sanitizeParams(params);

  const native = getNativeAnalytics();
  if (native?.logScreenView) {
    try {
      await native.logScreenView({ screen_name: name, screen_class: name, ...safeParams });
    } catch {}
    return;
  }

  await trackEvent('screen_view', { screen_name: name, screen_class: name, ...safeParams });
}

export async function identifyUser({ uid, universityId, universityName } = {}) {
  if (!enabled) return;

  const userId = uid ? trimString(uid, 256) : null;
  const uniId = universityId ? trimString(universityId, 36) : null;
  const uniName = universityName ? trimString(universityName, 36) : null;

  const native = getNativeAnalytics();
  if (native?.setUserId) {
    try {
      await native.setUserId(userId);
    } catch {}
    if (native?.setUserProperties) {
      try {
        const props = {};
        if (uniId) props.university_id = uniId;
        if (uniName) props.university_name = uniName;
        await native.setUserProperties(props);
      } catch {}
    }
    return;
  }

  const web = await getWebAnalytics();
  if (!web) return;
  const mod = await getWebModule();
  if (!mod) return;

  if (mod.setUserId) {
    try {
      await mod.setUserId(web, userId);
    } catch {}
  }
  if (mod.setUserProperties) {
    try {
      const props = {};
      if (uniId) props.university_id = uniId;
      if (uniName) props.university_name = uniName;
      await mod.setUserProperties(web, props);
    } catch {}
  }
}

export async function trackError(error, context) {
  const err = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
  await trackEvent('app_error', {
    error_name: trimString(err.name || 'Error', 40),
    error_message: trimString(err.message || 'Unknown error', 120),
    error_stack: trimString(err.stack || '', 120),
    context: trimString(context || '', 80),
    platform: Platform.OS,
  });
}

export function installGlobalErrorHandlers() {
  if (errorHandlersInstalled) return;
  errorHandlersInstalled = true;

  const g = global;

  const errorUtils = g?.ErrorUtils;
  const prevHandler =
    typeof errorUtils?.getGlobalHandler === 'function' ? errorUtils.getGlobalHandler() : null;
  if (typeof errorUtils?.setGlobalHandler === 'function') {
    errorUtils.setGlobalHandler((err, isFatal) => {
      trackError(err, isFatal ? 'fatal' : 'global');
      if (typeof prevHandler === 'function') prevHandler(err, isFatal);
    });
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      trackError(e?.error || e?.message || e, 'window_error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      trackError(e?.reason || e, 'unhandled_rejection');
    });
  }
}
