import React from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/UI";
import { colors } from "../utils/webTheme";

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Privacy Policy"
        onBack={() => navigation.goBack()}
        leftIconName="chevron-left"
        iconColor={colors.text}
        containerStyle={styles.header}
        titleStyle={styles.title}
        buttonStyle={styles.backBtn}
        rightPlaceholderWidth={40}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.h}>What we collect</Text>
        <Text style={styles.p}>
          StudentMate stores your basic profile info (like name and university selection) and the content you upload for review.
        </Text>

        <Text style={styles.h}>How we use it</Text>
        <Text style={styles.p}>
          We use this information to personalize your experience, show relevant content, and review uploads.
        </Text>

        <Text style={styles.h}>Ads</Text>
        <Text style={styles.p}>
          StudentMate may show banner ads and interstitial ads between papers.
        </Text>

        <Text style={styles.h}>Uploads</Text>
        <Text style={styles.p}>
          If you upload content, it is saved securely and may be reviewed before being published.
        </Text>

        <Text style={styles.h}>Your choices</Text>
        <Text style={styles.p}>
          You can request help by using “Report a problem” in Profile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: colors.text },
  content: { padding: 16 },
  h: { marginTop: 14, fontSize: 16, fontWeight: "900", color: colors.text },
  p: { marginTop: 6, color: colors.textSoft, lineHeight: 20 },
});
