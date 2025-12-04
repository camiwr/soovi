import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { listAreasByOwner } from "@/services/areas";
import type { Area } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

export default function SimulationSelectAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) throw new Error("Usuário não autenticado.");
        const data = await listAreasByOwner(user.id, { timestamp: Date.now() });
        setAreas(data);
      } catch (e: any) {
        console.log("Erro ao carregar áreas", e);
        Alert.alert("Erro", e?.message ?? "Falha ao carregar áreas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Carregando áreas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Selecione a área para a qual deseja gerar uma simulação:
      </Text>

      <FlatList
        data={areas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/simulations/create",
                params: { areaId: item.id },
              })
            }
          >
            <Text style={styles.cardTitle}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16 },
  infoText: { marginBottom: 16, color: "#4b5563" },
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
});