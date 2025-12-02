import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InputSpinner from "react-native-input-spinner";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getSimulation, updateSimulation } from "@/services/simulations";
import { getArea } from "@/services/areas";
import type { Simulation } from "@/types/simulation";
import type { Area } from "@/types/area";

export default function EditSimulationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  const [years, setYears] = useState("5");
  const [carency, setCarency] = useState("0");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        // 1) Busca a simulação
        const sim = await getSimulation(String(id));
        setSimulation(sim);

        // Preenche os campos com os valores atuais
        setYears(String(sim.receiving_years ?? 5));
        setCarency(String(sim.carency_period ?? 0));

        // 2) Busca a área da simulação
        const a = await getArea(sim.area_id);
        setArea(a);
      } catch (e: any) {
        console.log("Erro ao carregar simulação/área", e);
        Alert.alert(
          "Erro",
          e?.response?.data?.message ??
            e?.message ??
            "Falha ao carregar dados da simulação."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async () => {
  try {
    if (!simulation) throw new Error("Simulação inválida.");

    const receiving_years = Math.max(1, parseInt(years || "5", 10));
    const carency_period = Math.max(0, parseInt(carency || "0", 10));

    await updateSimulation(String(simulation.id), {
      area_id: simulation.area_id,   
      receiving_years,
      carency_period,
    });

    router.replace({
      pathname: "/simulations/[id]",
      params: { id: String(simulation.id) },
    });

    Alert.alert("Sucesso", "Simulação atualizada!");
  } catch (e: any) {
    console.log("Erro ao atualizar simulação", e?.response?.data ?? e);
    Alert.alert(
      "Erro",
      e?.response?.data?.message ??
        e?.message ??
        "Falha ao atualizar simulação."
    );
  }
};


  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!simulation) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Simulação não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {area && (
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
            {area.location ? (
              <Text>Localização: {area.location}</Text>
            ) : null}
          </View>
        )}

        {/* Texto explicativo sobre a Carência (mesmo do create) */}
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
          <Text style={{ fontWeight: "700" }}>O que é a Carência?</Text>
          <Text style={{ color: "#334155" }}>
            O período de carência é o tempo (em anos) desde o início do projeto
            até o início do recebimento das parcelas.
          </Text>
          <Text style={{ color: "#334155" }}>
            Ex: 2 anos de carência e 7 de recebimento significam que o fluxo de
            caixa começa apenas no 3º ano e dura 7 anos.
          </Text>
        </View>

        {/* Anos de recebimento */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Anos de Recebimento *</Text>
          <InputSpinner
            value={Number(years || 5)}
            onChange={(num) => setYears(String(num))}
            min={1}
            step={1}
            skin="clean"
            height={44}
            buttonFontSize={18}
            inputStyle={{ fontSize: 16 } as any}
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>

        {/* Anos de carência */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Anos de Carência *</Text>
          <InputSpinner
            value={Number(carency || 0)}
            onChange={(num) => setCarency(String(num))}
            min={0}
            step={1}
            skin="clean"
            height={44}
            buttonFontSize={18}
            inputStyle={{ fontSize: 16 } as any}
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>

        {/* Botão de salvar, mesmo estilo do create */}
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
                  backgroundColor: "#2563eb",
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
                    Salvar alterações
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
