import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getSimulation, deleteSimulation } from "@/services/simulations";
import { getArea } from "@/services/areas";
import type {
  Simulation,
  ReceivablesScheduleApiItem,
} from "@/types/simulation";
import { formatCurrencyBRL } from "@/utils/formatCurrency";


type NormalizedScheduleItem = {
  year: string;
  value: number;
};

function normalizeSchedule(
  schedule: ReceivablesScheduleApiItem[] | undefined
): NormalizedScheduleItem[] {
  if (!schedule) return [];
  return schedule.map((item) => {
    const [year, rawValue] = Object.entries(item)[0] ?? ["-", 0];
    const num =
      typeof rawValue === "number"
        ? rawValue
        : rawValue != null
          ? Number(rawValue)
          : 0;
    return { year, value: Number.isNaN(num) ? 0 : num };
  });
}

export default function SimulationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<NormalizedScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getSimulation(id);
        setSimulation(data);
        setSchedule(normalizeSchedule(data.receivables_schedule));

        // área: tenta usar o nome vindo direto, se não tiver, busca no endpoint de área
        if (data.area?.name) {
          setAreaName(data.area.name);
        } else {
          try {
            const area = await getArea(data.area_id);
            if (area?.description) setAreaName(area.description);
          } catch (e) {
            console.log("Não foi possível carregar nome da área", e);
          }
        }
      } catch (error) {
        console.log("Erro ao carregar simulação", error);
        Alert.alert("Erro", "Não foi possível carregar a simulação.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Excluir simulação",
      "Tem certeza que deseja excluir esta simulação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              if (!id) return;
              await deleteSimulation(id);
              router.replace("/simulations");
            } catch (error) {
              console.log("Erro ao excluir simulação", error);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  };

  if (loading || !simulation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Carregando detalhes...</Text>
      </View>
    );
  }

  const areaLabel =
    areaName ??
    simulation.area_id;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulação</Text>
      <Text style={styles.subtitle}>
        Área: {areaLabel} •{" "}
        {new Date(simulation.simulated_at).toLocaleDateString()}
      </Text>

      {/* Resumo financeiro */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo financeiro</Text>
        <Row label="Valor bruto estimado" value={simulation.gross_estimated_value} />
        <Row label="Infraestrutura" value={simulation.infra_cost} />
        <Row label="Impostos" value={simulation.tax_cost} />
        <Row label="Comissões" value={simulation.commission_cost} />
        <Row label="Total de descontos" value={simulation.total_discounts} />
        <Row label="Receita líquida" value={simulation.net_revenue} bold />
      </View>

      {/* Parâmetros – sem mostrar os UUIDs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parâmetros utilizados</Text>
        <Text style={styles.helperText}>
          Impostos, comissão e lucro do parceiro foram aplicados conforme os
          parâmetros cadastrados para esta área.
        </Text>

        <Text style={[styles.helperText, { marginTop: 8, fontWeight: "600" }]}>
          Infraestrutura:
        </Text>
        {simulation.used_parameters.infra.map((item, idx) => (
          <Text key={idx} style={styles.helperText}>
            - {item.type}: R$ {formatCurrencyBRL(item.unit_value)} em{" "}
            {item.installments}x
          </Text>
        ))}
      </View>

      {/* Cronograma de recebíveis */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cronograma de recebíveis</Text>

        {Array.isArray(simulation.receivables_schedule) &&
          simulation.receivables_schedule.length > 0 ? (
          simulation.receivables_schedule.map((item, idx) => {
            // cada item é algo tipo { "2037": -181152 }
            const year = Object.keys(item)[0];
            const rawValue = year ? (item as any)[year] : 0;

            return (
              <View key={idx} style={styles.row}>
                <Text>Ano {year}</Text>
                <Text>R$ {formatCurrencyBRL(rawValue)}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.helperText}>
            Nenhum cronograma calculado para esta simulação.
          </Text>
        )}
      </View>

      {/* Configuração */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuração</Text>
        <Text style={styles.helperText}>
          Carência: {simulation.carency_period} anos
        </Text>
        <Text style={styles.helperText}>
          Anos de recebimento: {simulation.receiving_years} anos
        </Text>
        <Text style={styles.helperText}>
          Recebimento anual médio: R$ {formatCurrencyBRL(simulation.annual_receivable)}
        </Text>
        <Text style={styles.helperText}>
          Lucro do parceiro: R$ {formatCurrencyBRL(simulation.partner_profit)}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#2563eb" }]}
          onPress={() =>
            router.push({
              pathname: "/simulations/edit/[id]",
              params: { id: simulation.id },
            })
          }
        >
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#dc2626" }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: number | string | null | undefined;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={bold ? styles.bold : undefined}>{label}</Text>
      <Text style={bold ? styles.bold : undefined}>
        R$ {formatCurrencyBRL(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#6b7280", marginBottom: 12 },
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontWeight: "600", marginBottom: 8 },
  helperText: { color: "#374151", marginBottom: 2, fontSize: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bold: { fontWeight: "600" },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
