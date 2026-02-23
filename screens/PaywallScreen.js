import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "../providers/SubscriptionProvider";

export default function PaywallScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restore, isPro, loading } = useSubscription();
  const [busy, setBusy] = useState(false);

  const yearlyPkg = useMemo(() => {
    const pkgs = offerings?.availablePackages || [];
    if (!pkgs.length) return null;

    // Prefer annual package if present, else first package
    const annual =
      pkgs.find((p) => p.packageType === "ANNUAL") ||
      pkgs.find((p) => /year|annual/i.test(p.product?.title || "")) ||
      pkgs[0];

    return annual;
  }, [offerings]);

  const priceText = yearlyPkg?.product?.priceString ? `${yearlyPkg.product.priceString}/yr` : "";

  const onContinue = async () => {
    if (!yearlyPkg) {
      Alert.alert(
        "No plan found",
        "Add a subscription Product in Play Console and attach it to an Offering in RevenueCat."
      );
      return;
    }
    try {
      setBusy(true);
      await purchasePackage(yearlyPkg);
      Alert.alert("Success", "Premium activated. Ads are now removed.");
      navigation?.goBack?.();
    } catch (e) {
      const cancelled = e?.userCancelled || e?.code === "PURCHASE_CANCELLED_ERROR";
      if (!cancelled) Alert.alert("Purchase failed", e?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    try {
      setBusy(true);
      await restore();
      Alert.alert("Restore", isPro ? "Premium is active." : "No active subscription found.");
      if (isPro) navigation?.goBack?.();
    } catch (e) {
      Alert.alert("Restore failed", e?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Edit these to your real links (or route to your in-app screens)
  const TERMS_URL = "https://example.com/terms";
  const PRIVACY_URL = "https://example.com/privacy";

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* HERO */}
      <View style={styles.heroWrap}>
        <Image
          source={require("../assets/paywall-hero.png")}
          style={styles.hero}
          resizeMode="cover"
        />
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Unlock StudentMate Pro</Text>
      <Text style={styles.subtitle}>
        Study faster with past papers & memos  without interruptions.
      </Text>


      {/* COMPARISON */}
      <View style={styles.compareWrap}>
        <View style={styles.compareHeaderRow}>
          <View style={{ flex: 1 }} />
          <Text style={styles.colHeader}>FREE</Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>

        <FeatureRow label="Access past papers & questions" freeOk proOk />
        <FeatureRow label="View memos/answers" freeOk proOk />
        <FeatureRow label="Rewarded ads to unlock answers" freeOk proOk={false} />
        <FeatureRow label="No banner ads" freeOk={false} proOk />
        <FeatureRow label="No rewarded ads" freeOk={false} proOk />
      </View>

      {/* BOTTOM */}
      <View style={styles.bottomWrap}>
        <Text style={styles.priceLine}>
          {priceText ? `Subscribe to Pro for just ${priceText}` : "Subscribe to Pro to remove ads"}
        </Text>

        <TouchableOpacity
          style={[styles.cta, (busy || loading) && { opacity: 0.7 }]}
          onPress={onContinue}
          disabled={busy || loading}
          activeOpacity={0.9}
        >
          {busy || loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.ctaText}>Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <TouchableOpacity onPress={onRestore} disabled={busy || loading}>
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ label, freeOk, proOk }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureText}>{label}</Text>

      <View style={styles.iconCell}>
        <Text style={[styles.icon, freeOk ? styles.check : styles.dash]}>
          {freeOk ? "✓" : "—"}
        </Text>
      </View>

      <View style={[styles.iconCell, { alignItems: "center" }]}>
        <Text style={[styles.icon, proOk ? styles.proCheck : styles.dash]}>
          {proOk ? "✓" : "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  heroWrap: { height: 270, backgroundColor: "#fff" },
  hero: { width: "100%", height: "100%" },

  title: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: "#1f2937",
  },
  subtitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    paddingHorizontal: 24,
  },

  compareWrap: {
    marginTop: 14,
    marginHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
    position: "relative",
  },

  compareHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 6,
  },

  colHeader: {
    width: 64,
    textAlign: "center",
    fontWeight: "900",
    color: "#6b7280",
  },

  proPill: {
    width: 72,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  proPillText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  proColumnBg: {
    position: "absolute",
    right: 0,
    top: 40,
    bottom: 8,
    width: 96,
    backgroundColor: "#eef2ff",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    zIndex: -1,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  featureText: { flex: 1, color: "#6b7280", fontSize: 16, fontWeight: "600" },

  iconCell: { width: 64, alignItems: "center", justifyContent: "center" },

  icon: { fontSize: 18, fontWeight: "900" },
  check: { color: "#6b7280" },
  dash: { color: "#d1d5db" },
  proCheck: { color: "#4f46e5" },

  bottomWrap: {
    marginTop: "auto",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },

  priceLine: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 10,
  },

  cta: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#6ee7b7",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 18, fontWeight: "900", color: "#064e3b" },

  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  footerLink: { color: "#6b7280", fontWeight: "800" },
});