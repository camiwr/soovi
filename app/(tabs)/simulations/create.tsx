import { getArea } from "@/services/areas";
import { createSimulation } from "@/services/simulations";
import type { Area } from "@/types/area";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateSimulationScreen() {
  const router = useRouter();
  const { areaId } = useLocalSearchParams<{ areaId: string }>();

  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  const [years, setYears] = useState("10");
  const [carency, setCarency] = useState("0");

  useEffect(() => {
    (async () => {
      try {
        const a = await getArea(String(areaId));
        setArea(a);
      } catch (e: any) {
        Alert.alert(
          "Erro",
          e?.response?.data?.message ??
            e?.message ??
            "Falha ao carregar área."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [areaId]);

  const onSubmit = async () => {
    try {
      if (!area) throw new Error("Área inválida.");

      const receiving_years = Math.max(1, parseInt(years || "10", 10));
      const carency_period = Math.max(0, parseInt(carency || "0", 10));

      const created = await createSimulation({
        area_id: area.id,
        receiving_years,
        carency_period,
      });

      router.replace({
        pathname: "/simulations/[id]",
        params: {
          id: created.id,
          data: encodeURIComponent(JSON.stringify(created)),
        },
      });

      Alert.alert("Sucesso", "Simulação criada!");
    } catch (e: any) {
      Alert.alert(
        "Erro",
        e?.response?.data?.message ??
          e?.message ??
          "Falha ao criar simulação."
      );
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!area) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Área não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* Card da área */}
        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 16 }}>
            {area.description}
          </Text>
          <Text>Área total: {area.total_area_hectare} ha</Text>
          {area.location ? <Text>Localização: {area.location}</Text> : null}
        </View>

        {/* Texto explicativo sobre a carência */}
        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            backgroundColor: "#f8fafc",
            gap: 6,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Sem carência</Text>
          <Text style={{ color: "#334155" }}>
            Não há período de carência. Os pagamentos começam já no 1º ano do projeto.
          </Text>
          <Text style={{ color: "#334155" }}>
            Ex.: 7 anos de recebimento → os pagamentos começam no 1º ano e duram 7 anos.
          </Text>
        </View>

        {/* Anos de recebimento */}
        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "600" }}>Anos de Recebimento</Text>
          <Text style={{ fontSize: 16, color: "#334155" }}>10 anos</Text>
        </View>

        {/* Anos de carência */}
        <View
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontWeight: "600" }}>Anos de Carência</Text>
          <Text style={{ fontSize: 16, color: "#334155" }}>0 anos</Text>
        </View>

        {/* Botão de submit com estado interno */}
        {(() => {
          const SubmitButton: React.FC = () => {
            const [submitting, setSubmitting] = React.useState(false);

            const handle = async () => {
              try {
                setSubmitting(true);
                await onSubmit();
              } finally {
                setSubmitting(false);
              }
            };

            return (
              <TouchableOpacity
                onPress={handle}
                disabled={submitting}
                style={{
                  backgroundColor: "#16a34a",
                  padding: 14,
                  borderRadius: 10,
                  opacity: submitting ? 0.8 : 1,
                  marginTop: 10,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    Simular
                  </Text>
                )}
              </TouchableOpacity>
            );
          };

          return <SubmitButton />;
        })()}
      </ScrollView>
    </View>
  );
}
