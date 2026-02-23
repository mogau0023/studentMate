import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';

function getExtra() {
  const cfg = Constants?.expoConfig || Constants?.manifest || {};
  return (cfg.extra || {});
}

export function adsEnabled() {
  const extra = getExtra();
  if (typeof extra.adsDisabled === 'boolean') {
    return !extra.adsDisabled;
  }
  return true;
}

export function bannerUnitId() {
  if (__DEV__) return TestIds.BANNER;
  const extra = getExtra();
  const iosId = extra.iosBannerUnitId;
  const androidId = extra.androidBannerUnitId;
  if (Platform.OS === 'ios') return iosId || TestIds.BANNER;
  return androidId || TestIds.BANNER;
}

export function rewardedUnitId() {
  if (__DEV__) return TestIds.REWARDED;
  const extra = getExtra();
  const iosId = extra.iosRewardedUnitId;
  const androidId = extra.androidRewardedUnitId;
  if (Platform.OS === 'ios') return iosId || TestIds.REWARDED;
  return androidId || TestIds.REWARDED;
}
