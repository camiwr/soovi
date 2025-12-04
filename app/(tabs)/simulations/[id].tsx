import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getArea } from "@/services/areas";
import { deleteSimulation, getSimulation } from "@/services/simulations";
import type { Simulation } from "@/types/simulation";
import { formatCurrencyBRL } from "@/utils/formatCurrency";

function formatPercentage(
  value: string | number | null | undefined
): string {
  if (value == null) return "-";
  const num =
    typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

export default function SimulationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getSimulation(String(id));
        setSimulation(data);

        // Prioriza os campos que já vêm na simulação
        if (data.area_name) {
          setAreaName(data.area_name);
        } else if (data.area?.description) {
          setAreaName(data.area.description);
        } else {
          // fallback: tenta buscar a área
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
              await deleteSimulation(String(id));
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
    simulation.area_name ??
    simulation.area?.description ??
    simulation.area_id;

  const scheduleEntries = Object.entries(
    simulation.receivables_schedule || {}
  ); 

  const { used_parameters } = simulation;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulação de Área: {areaName}</Text>
      <Text style={styles.subtitle}>
        Área: {areaLabel} •{" "}
        {new Date(simulation.simulated_at).toLocaleDateString()}
      </Text>

      {/* Resumo financeiro */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo financeiro</Text>
        <Row
          label="Valor bruto estimado"
          value={simulation.gross_estimated_value}
        />
        <Row label="Infraestrutura" value={simulation.infra_cost} />
        <Row label="Impostos" value={simulation.tax_cost} />
        <Row label="Comissões" value={simulation.commission_cost} />
        <Row
          label="Total de descontos"
          value={simulation.total_discounts}
        />
        <Row
          label="Receita líquida"
          value={simulation.net_revenue}
          bold
        />
      </View>

      {/* Parâmetros utilizados */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parâmetros utilizados</Text>

        <Text style={styles.helperText}>
          Imposto: {formatPercentage(used_parameters.imposto)}
        </Text>
        <Text style={styles.helperText}>
          Comissão: {formatPercentage(used_parameters.comissao)}
        </Text>
        <Text style={styles.helperText}>
          Lucro do parceiro:{" "}
          {formatPercentage(used_parameters.lucro_parceiro)}
        </Text>

        <Text
          style={[
            styles.helperText,
            { marginTop: 8, fontWeight: "600" },
          ]}
        >
          Infraestrutura:
        </Text>
        {used_parameters.infra.map((item, idx) => (
          <Text key={idx} style={styles.helperText}>
            - {item.type}: {formatCurrencyBRL(item.unit_value)} em{" "}
            {item.installments}x
          </Text>
        ))}
      </View>

      {/* Cronograma de recebíveis */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cronograma de recebíveis</Text>

        {scheduleEntries.length === 0 ? (
          <Text style={styles.helperText}>
            Nenhum cronograma calculado para esta simulação.
          </Text>
        ) : (
          scheduleEntries.map(([year, value]) => (
            <View key={year} style={styles.row}>
              <Text>Ano {year}</Text>
              <Text>{formatCurrencyBRL(value)}</Text>
            </View>
          ))
        )
        }
      </View>

      {/* Configuração */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuração</Text>
        <Text style={styles.helperText}>
          Carência: {simulation.carency_period} meses
        </Text>
        <Text style={styles.helperText}>
          Anos de recebimento: {simulation.receiving_years} anos
        </Text>
        <Text style={styles.helperText}>
          Recebimento anual médio:{" "}
          {formatCurrencyBRL(simulation.annual_receivable)}
        </Text>
        <Text style={styles.helperText}>
          Lucro do parceiro: {formatCurrencyBRL(simulation.partner_profit)}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#2563eb" }]}
          onPress={() =>
            router.push({
              pathname: "/simulations/edit/[id]",
              params: { id: String(simulation.id) },
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
        {formatCurrencyBRL(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#1f2937" },
  subtitle: { color: "#4b5563", marginBottom: 16, fontSize: 16 },
  card: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontWeight: "700", marginBottom: 12, fontSize: 18, color: "#111827" },
  helperText: { color: "#374151", marginBottom: 4, fontSize: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  bold: { fontWeight: "700", color: "#1f2937" },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
  },
  actionText: { color: "#ffffff", textAlign: "center", fontWeight: "700", fontSize: 16 },
});