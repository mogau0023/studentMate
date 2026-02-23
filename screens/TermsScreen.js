import React from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Use</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.h}>StudentMate Terms</Text>
        <Text style={styles.p}>
          By using StudentMate, you agree to use the app responsibly and for learning purposes.
        </Text>

        <Text style={styles.h}>Content</Text>
        <Text style={styles.p}>
          StudentMate provides access to study materials such as question papers and memorandums.
          Some content may be uploaded by users and reviewed before it becomes available.
        </Text>

        <Text style={styles.h}>No cheating</Text>
        <Text style={styles.p}>
          Do not use StudentMate to cheat in assessments. Use it to study and practice.
        </Text>

        <Text style={styles.h}>Accounts</Text>
        <Text style={styles.p}>
          You are responsible for your account. If you think your account is being misused, report a problem from Profile.
        </Text>

        <Text style={styles.h}>Subscriptions</Text>
        <Text style={styles.p}>
          StudentMate Pro removes ads. Subscription billing is handled by the app store. You can restore purchases in the Paywall screen.
        </Text>

        <Text style={styles.h}>Changes</Text>
        <Text style={styles.p}>
          We may update these terms from time to time. Continued use of the app means you accept the updated terms.
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