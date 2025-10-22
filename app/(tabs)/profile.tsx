import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getAccessTokenInMemory } from "../../services/client"; // p/ debug visual do token

function getInitials(input: string) {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const { user, clearSession } = useAuth();

  const [name, setName] = useState<string>(user?.name ?? "");
  const [phone, setPhone] = useState<string>(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.id]);

  const avatarText = useMemo(() => getInitials(user?.name || user?.email || "U"), [user?.name, user?.email]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: conectar com PATCH /users/me
      Toast.show({ type: "success", text1: "Dados atualizados!" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Não foi possível salvar", text2: e?.message ?? "Tente novamente" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await clearSession();
    Toast.show({ type: "success", text1: "Você saiu da conta" });
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.contentContainer}>
      <View style={s.header}>
        <View style={s.avatarContainer}>
          <View style={s.avatar}><Text style={s.avatarText}>{avatarText}</Text></View>
          <View style={s.statusBadge}><Text style={s.statusText}>●</Text></View>
        </View>
        <Text style={s.userName}>{user?.name || "Usuário"}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionIcon}>👤</Text>
          <Text style={s.sectionTitle}>Informações Pessoais</Text>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoLabel}>E-mail</Text>
          <Text style={s.infoValue}>{user?.email}</Text>
        </View>

        {!!user?.cpf && (
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>CPF</Text>
            <Text style={s.infoValue}>{user?.cpf}</Text>
          </View>
        )}

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Nome Completo</Text>
          <TextInput
            style={s.input}
            placeholder="Digite seu nome completo"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Telefone</Text>
          <TextInput
            style={s.input}
            placeholder="(11) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionIcon}>⚙️</Text>
          <Text style={s.sectionTitle}>Ações</Text>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.primaryButton, saving && s.buttonDisabled]}>
          <Text style={s.buttonIcon}>💾</Text>
          <Text style={s.primaryButtonText}>{saving ? "Salvando..." : "Salvar Alterações"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignOut} style={s.secondaryButton}>
          <Text style={s.buttonIcon}>🚪</Text>
          <Text style={s.secondaryButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  contentContainer: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 20 },
  avatarContainer: { width: 86, height: 86, marginBottom: 10 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#3730A3" },
  statusBadge: { position: "absolute", bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  statusText: { color: "#065F46", fontSize: 10, marginTop: -2 },

  userName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  userEmail: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  section: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginTop: 18, borderWidth: 1, borderColor: "#E5E7EB" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  infoCard: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 2 },

  inputGroup: { marginTop: 10 },
  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FFFFFF", fontSize: 16 },

  primaryButton: { backgroundColor: "#2563EB", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  buttonIcon: { marginRight: 8, fontSize: 16 },

  secondaryButton: { backgroundColor: "#F3F4F6", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  secondaryButtonText: { color: "#111827", fontWeight: "800", fontSize: 15 },
});
