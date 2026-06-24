import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getExtra() {
  const cfg = Constants?.expoConfig || Constants?.manifest || {};
  return cfg.extra || {};
}

export function adsEnabled() {
  const extra = getExtra();
  if (typeof extra.adsDisabled === 'boolean') {
    return !extra.adsDisabled;
  }
  return false; // 👈 disable ads for now on web
}

export function bannerUnitId() {
  if (Platform.OS === 'web') return null;

  const extra = getExtra();
  const iosId = extra.iosBannerUnitId;
  const androidId = extra.androidBannerUnitId;

  return Platform.OS === 'ios' ? iosId : androidId;
}

export function interstitialUnitId() {
  if (Platform.OS === 'web') return null;

  const extra = getExtra();
  const iosId = extra.iosInterstitialUnitId;
  const androidId = extra.androidInterstitialUnitId;

  return Platform.OS === 'ios' ? iosId : androidId;
}