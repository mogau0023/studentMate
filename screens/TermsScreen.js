import React from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/UI";
import { colors } from "../utils/webTheme";

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Terms of Use"
        onBack={() => navigation.goBack()}
        leftIconName="chevron-left"
        iconColor={colors.text}
        containerStyle={styles.header}
        titleStyle={styles.title}
        buttonStyle={styles.backBtn}
        rightPlaceholderWidth={40}
      />

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

        <Text style={styles.h}>Ads</Text>
        <Text style={styles.p}>
          StudentMate may show ads between papers.
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
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: colors.text },
  content: { padding: 16 },
  h: { marginTop: 14, fontSize: 16, fontWeight: "900", color: colors.text },
  p: { marginTop: 6, color: colors.textSoft, lineHeight: 20 },
});
