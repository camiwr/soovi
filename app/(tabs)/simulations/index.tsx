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
import type { Simulation } from "@/types/simulation";
import { formatCurrencyBRL } from "@/utils/formatCurrency";

export default function SimulationListScreen() {
  const router = useRouter();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await listSimulations();

        const valid = (resp.simulationData || []).filter(
          (item: any) => item && item.id
        ) as Simulation[];

        setSimulations(valid);
      } catch (error) {
        console.log("Erro ao carregar simulações", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const areaLabel =
              item.area_name ??
              item.area?.description ??
              "Área não informada";

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/simulations/[id]",
                    params: { id: String(item.id) },
                  })
                }
              >
                <Text style={styles.cardTitle}>
                  Simulação da Área: {areaLabel}
                </Text>
                <Text style={styles.cardSubtitle}>Área: {areaLabel ?? "Área não informada"}</Text>
                <Text style={styles.cardSubtitle}>
                  Receita líquida: {formatCurrencyBRL(item.net_revenue)}
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