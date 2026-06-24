import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ScreenHeader } from "../components/UI";
import { colors } from "../utils/webTheme";

export default function ReportProblemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Login required", "Please login first.");
    if (!subject.trim() || !details.trim()) {
      return Alert.alert("Missing info", "Please fill in subject and details.");
    }

    try {
      setSending(true);
      await addDoc(collection(db, "reports"), {
        uid: user.uid,
        email: user.email || "",
        subject: subject.trim(),
        details: details.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Sent", "Thanks — your report was submitted.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Failed", e?.message || "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Report a problem"
        onBack={() => navigation.goBack()}
        leftIconName="chevron-left"
        iconColor={colors.text}
        containerStyle={styles.header}
        titleStyle={styles.title}
        buttonStyle={styles.backBtn}
        rightPlaceholderWidth={40}
      />

      <View style={styles.content}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. App crashed on memo view"
          style={styles.input}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Explain what happened, and what screen you were on."
          style={[styles.input, styles.textArea]}
          multiline
        />

        <TouchableOpacity style={[styles.btn, sending && { opacity: 0.7 }]} onPress={submit} disabled={sending}>
          <Text style={styles.btnText}>{sending ? "Sending..." : "Send report"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: colors.text },
  content: { padding: 16, gap: 10 },
  label: { fontWeight: "800", color: colors.textSoft },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.input, color: colors.text },
  textArea: { height: 140, textAlignVertical: "top" },
  btn: { marginTop: 8, height: 52, borderRadius: 16, backgroundColor: colors.brandStrong, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
