import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import { listSimulations } from "@/services/simulations";
import { listAreasByOwner } from "@/services/areas";
import type { Simulation } from "@/types/simulation";
import type { Area } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

function formatCurrency(value: number | string | null | undefined) {
  const num =
    typeof value === "number"
      ? value
      : value != null
      ? Number(value)
      : 0;
  if (Number.isNaN(num)) return "-";
  return num.toFixed(2);
}

export default function SimulationListScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [areaMap, setAreaMap] = useState<Record<string, Area>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) throw new Error("Usuário não autenticado.");

        const [simResp, areas] = await Promise.all([
          listSimulations(),
          listAreasByOwner(user.id, { timestamp: Date.now() }),
        ]);

        setSimulations(simResp.simulationData);

        const map: Record<string, Area> = {};
        areas.forEach((a) => {
          map[a.id] = a;
        });
        setAreaMap(map);
      } catch (e) {
        console.log("Erro ao carregar simulações/áreas", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Carregando simulações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => router.push("/simulations/select-area")}
      >
        <Text style={styles.newButtonText}>+ Nova simulação</Text>
      </TouchableOpacity>

      {simulations.length === 0 ? (
        <Text style={styles.emptyText}>
          Você ainda não possui simulações.
        </Text>
      ) : (
        <FlatList
          data={simulations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const areaName = areaMap[item.area_id]?.description ?? "Área desconhecida";
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/simulations/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.cardTitle}>Simulação #{item.id}</Text>
                <Text style={styles.cardSubtitle}>Área: {areaName}</Text>
                <Text style={styles.cardSubtitle}>
                  Receita líquida: R$ {formatCurrency(item.net_revenue)}
                </Text>
                <Text style={styles.cardDate}>
                  Simulada em:{" "}
                  {new Date(item.simulated_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16 },
  newButton: {
    marginBottom: 16,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
  },
  newButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  emptyText: { textAlign: "center", marginTop: 32, color: "#6b7280" },
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardSubtitle: { color: "#4b5563" },
  cardDate: { marginTop: 4, fontSize: 12, color: "#9ca3af" },
});
