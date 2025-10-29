import { getArea } from "@/services/areas";
import { createSimulation } from "@/services/simulations";
import type { Area } from "@/types/area";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CreateSimulationScreen() {
    const router = useRouter();
    const { areaId } = useLocalSearchParams<{ areaId: string }>();
    const [area, setArea] = useState<Area | null>(null);
    const [loading, setLoading] = useState(true);
    const [years, setYears] = useState("5"); // padrão 5

    useEffect(() => {
        (async () => {
            try {
                const a = await getArea(String(areaId));
                setArea(a);
            } catch (e: any) {
                Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar área.");
            } finally { setLoading(false); }
        })();
    }, [areaId]);

    const onSubmit = async () => {
        try {
            if (!area) throw new Error("Área inválida.");
            const receiving_years = Math.max(1, parseInt(years || "5", 10));
            const created = await createSimulation({ area_id: area.id, receiving_years });
            router.replace({
                pathname: "/simulations/[id]",
                params: { id: created.id, data: encodeURIComponent(JSON.stringify(created)) }
            });
            Alert.alert("Sucesso", "Simulação criada!");
        } catch (e: any) {
            Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao criar simulação.");
        }
    };

    if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
    if (!area) return <View style={{ padding: 16 }}><Text>Área não encontrada.</Text></View>;

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 24, color: '#007AFF' }}>←</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16 }}>Criar Simulação</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fff" }}>
                <Text style={{ fontWeight: "800", fontSize: 16 }}>{area.description}</Text>
                <Text>Área total: {area.total_area_hectare} ha</Text>
                {area.location ? <Text>Localização: {area.location}</Text> : null}
            </View>

            <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f8fafc" }}>
                <Text style={{ fontWeight: "700", marginBottom: 6 }}>Como funciona?</Text>
                <Text style={{ color: "#334155" }}>
                    A simulação é calculada pelo nosso sistema com parâmetros padrão (infraestrutura, impostos, comissão, etc.).
                    Você só escolhe o período de recebimento (anos) e confirma.
                </Text>
            </View>

            {/* Único campo necessário */}
            <View style={{ gap: 6 }}>
                <Text style={{ fontWeight: "600" }}>Anos de recebimento *</Text>
                <TextInput
                    value={years}
                    onChangeText={setYears}
                    keyboardType="number-pad"
                    style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fff", padding: 10, fontSize: 16 }}
                    placeholder="5"
                />
            </View>

            {/* (Opcional) mostrar infra global do sistema aqui */}

            <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: "#16a34a", padding: 14, borderRadius: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Simular</Text>
            </TouchableOpacity>
        </ScrollView>
    </View>
    );
}
