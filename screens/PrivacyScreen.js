import React from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

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
          Free users may see banner and rewarded ads. StudentMate Pro removes all ads.
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
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#111" },
  content: { padding: 16 },
  h: { marginTop: 14, fontSize: 16, fontWeight: "900", color: "#0f172a" },
  p: { marginTop: 6, color: "#475569", lineHeight: 20 },
});