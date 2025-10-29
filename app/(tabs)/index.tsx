import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

type Activity = {
  id: string;
  type: "simulation" | "area";
  title: string;
  created_at: string; 
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  const firstName = useMemo(() => {
    const base = user?.name || user?.email || "Usuário";
    const chunk = base.split(" ")[0];
    return chunk.replace(/@.*/, "");
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const mock: Activity[] = [];
        if (isMounted) setActivities(mock);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleNovaArea = () => {
    router.push("/areas/create"); 
  };

  const handleMyAreas = () => {
    router.push("/areas"); 
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24, alignItems: "center" }}>
      <Text style={s.h1}>Olá, {firstName}!</Text>
      <Text style={s.subtitle}>O que você gostaria de fazer hoje?</Text>

      <TouchableOpacity style={s.bigCard} onPress={handleNovaArea} activeOpacity={0.9}>
        <View style={s.plusCircle}><Text style={s.plusText}>＋</Text></View>
        <Text style={s.bigTitle}>Nova Área</Text>
        <Text style={s.bigDesc}>Criar uma nova área</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.card} onPress={handleMyAreas} activeOpacity={0.9}>
        <View style={s.iconCircle}><Text style={{ fontSize: 18 }}>📍</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Minhas Áreas</Text>
          <Text style={s.cardDesc}>Visualizar áreas cadastradas</Text>
        </View>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Últimas Atividades</Text>

      {loading ? (
        <Text style={s.muted}>Carregando...</Text>
      ) : activities.length === 0 ? (
        <Text style={s.muted}>Sem atividades recentes.</Text>
      ) : (
        <View style={{ gap: 12, width: "100%" }}>
          {activities.map((a) => (
            <View key={a.id} style={s.activityItem}>
              <View style={s.activityIcon}>
                <Text style={{ fontSize: 16 }}>{a.type === "simulation" ? "📊" : "🗺️"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.activityTitle}>{a.title}</Text>
                <Text style={s.activityTime}>{formatRelative(a.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return `Há ${diffDays} dias`;
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 28, paddingHorizontal: 20, backgroundColor: "#F9FAFB" },
  h1: { fontSize: 24, fontWeight: "800", color: "#111827", width: "100%" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#6B7280", width: "100%", marginBottom: 20 },

  bigCard: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18,
    alignItems: "flex-start", marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  plusCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  plusText: { fontSize: 28, color: "#3730A3", lineHeight: 28 },
  bigTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  bigDesc: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  card: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#ECFEFF",
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  sectionTitle: {
    width: "100%", fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8,
  },
  muted: { width: "100%", color: "#6B7280", fontSize: 13 },

  activityItem: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12,
  },
  activityIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  activityTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  activityTime: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
