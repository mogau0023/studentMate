import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { File } from "expo-file-system";
import { colors, cardShadow } from "../utils/webTheme";

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);

  const storage = getStorage();

  // Selected file (picked first)
  const [pickedAsset, setPickedAsset] = useState(null);

  // Modal
  const [metaOpen, setMetaOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [paperType, setPaperType] = useState(""); // Test/Exam/supp/memo

  const paperTypeOptions = useMemo(() => ["Test", "Exam", "supp", "memo"], []);

  function makeToken(len = 32) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async function uploadToFirebaseStorageREST({
    fileUri,
    storagePath,
    contentType,
    storageBucket,
    idToken,
  }) {
    const downloadToken = makeToken(32);

    const url =
      `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o` +
      `?uploadType=media&name=${encodeURIComponent(storagePath)}`;

    const res = await FileSystem.uploadAsync(url, fileUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": contentType || "application/octet-stream",
        "x-goog-meta-firebaseStorageDownloadTokens": downloadToken,
      },
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `Storage upload failed (${res.status}): ${res.body?.slice?.(0, 200) || "Unknown error"}`
      );
    }

    const downloadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(
        storagePath
      )}?alt=media&token=${downloadToken}`;

    return { downloadUrl, downloadToken };
  }

  const resetForm = () => {
    setTitle("");
    setYear("");
    setModuleCode("");
    setPaperType("");
  };

  const startPick = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Login required", "Please login first.");

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"], // you asked PDF
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const asset = picked.assets?.[0];
      if (!asset?.uri) throw new Error("No file selected");

      // Basic size guard (avoid huge PDFs killing memory/network)
      const fileObj = new File(asset.uri);
      const maxBytes = 20 * 1024 * 1024; // 20MB
      if (fileObj.size && fileObj.size > maxBytes) {
        throw new Error("File too large. Please upload a PDF under 20MB.");
      }

      setPickedAsset(asset);
      resetForm();
      setMetaOpen(true);
    } catch (e) {
      Alert.alert("Failed", e?.message || "Please try again.");
    }
  };

  const submitUpload = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Login required", "Please login first.");
    if (!pickedAsset?.uri) return Alert.alert("No file", "Please select a PDF again.");

    const t = title.trim();
    const y = year.trim();
    const m = moduleCode.trim().toUpperCase();
    const p = paperType.trim();

    if (!t) return Alert.alert("Missing info", "Title / Name is required.");
    if (!/^\d{4}$/.test(y)) return Alert.alert("Invalid year", "Year must be 4 digits (e.g. 2024).");
    if (!m) return Alert.alert("Missing info", "Module code is required.");
    if (!p) return Alert.alert("Missing info", "Paper type is required.");

    try {
      setUploading(true);

      const safeName = (pickedAsset.name || "upload").replace(/[^\w.\-]+/g, "_");
      const storagePath = `user-uploads/${user.uid}/${Date.now()}_${safeName}`;

      const storageBucket = storage.app.options.storageBucket;
      if (!storageBucket) throw new Error("Missing storageBucket in Firebase config.");

      const idToken = await user.getIdToken();

      const contentType = pickedAsset.mimeType || "application/pdf";

      const { downloadUrl } = await uploadToFirebaseStorageREST({
        fileUri: pickedAsset.uri,
        storagePath,
        contentType,
        storageBucket,
        idToken,
      });

      await addDoc(collection(db, "user_uploads"), {
        uid: user.uid,
        email: user.email || "",
        title: t,
        year: Number(y),
        moduleCode: m,
        paperType: p, // Test/Exam/supp/memo
        fileName: pickedAsset.name || "",
        mimeType: pickedAsset.mimeType || "application/pdf",
        size: new File(pickedAsset.uri).size || null,
        storagePath,
        downloadUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setMetaOpen(false);
      setPickedAsset(null);
      Alert.alert("Uploaded", "Thanks! Your PDF was submitted for review.");
    } catch (e) {
      Alert.alert("Upload failed", e?.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Upload</Text>
        </View>

        {/* INFO CARD (keep) */}
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Feather name="cloud-lightning" size={32} color="#0053A9" />
          </View>
          <Text style={styles.infoTitle}>Contribute to StudentMate</Text>
          <Text style={styles.infoText}>
            Upload a PDF question paper or memo. All uploads are reviewed before going live.
          </Text>
        </View>

        {/* BIG UPLOAD CARD */}
        <TouchableOpacity
          style={[styles.bigUploadCard, uploading && { opacity: 0.7 }]}
          onPress={startPick}
          disabled={uploading}
          activeOpacity={0.9}
        >
          <View style={styles.bigUploadIconWrap}>
            <Feather name="upload" size={46} color="#0053A9" />
          </View>
          <Text style={styles.bigUploadTitle}>Tap here to upload a PDF</Text>
          <Text style={styles.bigUploadSub}>Question paper or memo (PDF)</Text>

          {uploading ? (
            <View style={{ marginTop: 14 }}>
              <ActivityIndicator />
            </View>
          ) : null}
        </TouchableOpacity>
      </ScrollView>

      {/* METADATA MODAL AFTER PICK */}
      <Modal visible={metaOpen} transparent animationType="fade" onRequestClose={() => setMetaOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload details</Text>

            <Text style={styles.modalLabel}>Title / Name *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Calculus Paper 1"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Year (4 digits) *</Text>
            <TextInput
              value={year}
              onChangeText={(t) => setYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="e.g. 2024"
              keyboardType="number-pad"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Module code *</Text>
            <TextInput
              value={moduleCode}
              onChangeText={setModuleCode}
              placeholder="e.g. MTHS114"
              autoCapitalize="characters"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Paper type *</Text>
            <View style={styles.typeRow}>
              {paperTypeOptions.map((opt) => {
                const active = paperType === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setPaperType(opt)}
                  >
                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => {
                  setMetaOpen(false);
                  setPickedAsset(null);
                }}
                disabled={uploading}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnPrimary, uploading && { opacity: 0.7 }]}
                onPress={submitUpload}
                disabled={uploading}
              >
                <Text style={styles.modalBtnPrimaryText}>{uploading ? "Uploading..." : "Submit upload"}</Text>
              </TouchableOpacity>
            </View>

            {pickedAsset?.name ? (
              <Text style={styles.fileHint} numberOfLines={1}>
                Selected: {pickedAsset.name}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: { padding: 24 },

  header: { marginBottom: 14 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: colors.brand },

  infoCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...cardShadow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  infoTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8, textAlign: "center" },
  infoText: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },

  bigUploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 34,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...cardShadow,
  },
  bigUploadIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bigUploadTitle: { fontSize: 18, fontWeight: "900", color: colors.text, textAlign: "center" },
  bigUploadSub: { marginTop: 6, fontSize: 13, fontWeight: "700", color: colors.muted, textAlign: "center" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 10 },

  modalLabel: { marginTop: 10, fontWeight: "800", color: colors.textSoft, marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.input,
    color: colors.text,
  },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  typeChipActive: { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong },
  typeChipText: { fontWeight: "900", color: colors.text },
  typeChipTextActive: { color: "#fff" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtnGhost: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  modalBtnGhostText: { fontWeight: "900", color: colors.text },
  modalBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandStrong,
  },
  modalBtnPrimaryText: { fontWeight: "900", color: "#fff" },

  fileHint: { marginTop: 12, color: colors.muted, fontWeight: "700" },
});
