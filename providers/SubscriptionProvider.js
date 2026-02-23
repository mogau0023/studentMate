import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

function getExtra() {
  const cfg = Constants?.expoConfig || Constants?.manifest || {};
  return cfg.extra || {};
}

const SubscriptionContext = createContext({
  loading: true,
  isPro: false,
  customerInfo: null,
  refresh: async () => {},
  restore: async () => {},
  purchasePackage: async (_pkg) => {},
});

export function SubscriptionProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);

  const entitlementId = getExtra().revenueCatEntitlementId || 'pro';

  useEffect(() => {
    let isMounted = true;

    const apiKey =
      Platform.OS === 'ios'
        ? getExtra().revenueCatAppleApiKey
        : getExtra().revenueCatGoogleApiKey;

    if (!apiKey) {
      console.warn(
        '[RevenueCat] Missing API key. Set extra.revenueCatAppleApiKey / extra.revenueCatGoogleApiKey in app.json'
      );
    }

    // Configure once; later we log in/out based on Firebase auth.
    Purchases.configure({ apiKey: apiKey || '' });

    const listener = (info) => {
      if (!isMounted) return;
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user?.uid) {
          await Purchases.logIn(user.uid);
        } else {
          await Purchases.logOut();
        }
        const info = await Purchases.getCustomerInfo();
        if (isMounted) setCustomerInfo(info);
      } catch (e) {
        console.warn('[RevenueCat] auth sync failed', e?.message || e);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      try { unsubAuth(); } catch {}
      try { Purchases.removeCustomerInfoUpdateListener(listener); } catch {}
    };
  }, []);

  const isPro = !!customerInfo?.entitlements?.active?.[entitlementId];

  const value = useMemo(
    () => ({
      loading,
      isPro,
      customerInfo,
      refresh: async () => {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        return info;
      },
      restore: async () => {
        const info = await Purchases.restorePurchases();
        setCustomerInfo(info);
        return info;
      },
      purchasePackage: async (pkg) => {
        const res = await Purchases.purchasePackage(pkg);
        setCustomerInfo(res.customerInfo);
        return res.customerInfo;
      },
    }),
    [loading, isPro, customerInfo]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}