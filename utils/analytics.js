import { Platform } from 'react-native';
import { app } from '../firebase';
import { getAnalytics, isSupported, logEvent, setUserId, setUserProperties } from 'firebase/analytics';

let enabled = true;
let nativeAnalytics;
let webAnalytics;
let webInitPromise;
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

async function getWebAnalytics() {
  console.log('[Analytics] getWebAnalytics called, Platform:', Platform.OS);
  console.log('[Analytics] app.options:', app?.options);
  if (Platform.OS !== 'web') return null;
  if (!app?.options?.measurementId) {
    console.log('[Analytics] No measurementId found!');
    return null;
  }
  if (webAnalytics) {
    console.log('[Analytics] Returning existing webAnalytics');
    return webAnalytics;
  }
  if (!webInitPromise) {
    webInitPromise = (async () => {
      console.log('[Analytics] Initializing web analytics...');
      try {
        const supported = await isSupported();
        console.log('[Analytics] isSupported:', supported);
        if (!supported) {
          console.log('[Analytics] Analytics not supported in this environment');
          return null;
        }
        webAnalytics = getAnalytics(app);
        console.log('[Analytics] Web analytics initialized:', webAnalytics);
        return webAnalytics;
      } catch (e) {
        console.error('[Analytics] Error initializing web analytics:', e);
        return null;
      }
    })();
  }
  return webInitPromise;
}

export function setAnalyticsEnabled(v) {
  enabled = !!v;
}

export async function trackEvent(name, params) {
  console.log('[Analytics] trackEvent called with name:', name, 'params:', params);
  if (!enabled || !name) {
    console.log('[Analytics] trackEvent skipped, enabled:', enabled, 'name:', name);
    return;
  }
  const safeParams = sanitizeParams(params);
  console.log('[Analytics] safeParams:', safeParams);

  const native = getNativeAnalytics();
  if (native?.logEvent) {
    try {
      console.log('[Analytics] Using native analytics');
      await native.logEvent(name, safeParams);
      console.log('[Analytics] Native event logged');
    } catch (e) {
      console.error('[Analytics] Native logEvent error:', e);
    }
    return;
  }

  console.log('[Analytics] Using web analytics');
  const web = await getWebAnalytics();
  if (!web) {
    console.log('[Analytics] No web analytics available');
    return;
  }
  try {
    console.log('[Analytics] Calling web logEvent');
    logEvent(web, name, safeParams);
    console.log('[Analytics] Web event logged');
  } catch (e) {
    console.error('[Analytics] Web logEvent error:', e);
  }
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

  try {
    if (userId) {
      setUserId(web, userId);
    }
    const props = {};
    if (uniId) props.university_id = uniId;
    if (uniName) props.university_name = uniName;
    if (Object.keys(props).length > 0) {
      setUserProperties(web, props);
    }
  } catch (e) {
    console.error('[Analytics] identifyUser error:', e);
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
