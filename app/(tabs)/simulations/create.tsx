import { getArea } from "@/services/areas";
import { createSimulation } from "@/services/simulations";
import type { Area } from "@/types/area";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import InputSpinner from "react-native-input-spinner";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CreateSimulationScreen() {
    const router = useRouter();
    const { areaId } = useLocalSearchParams<{ areaId: string }>();
    const [area, setArea] = useState<Area | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [years, setYears] = useState("5"); 
    const [carency, setCarency] = useState("0"); 

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
            const carency_period = Math.max(0, parseInt(carency || "0", 10));

            const created = await createSimulation({ 
                area_id: area.id, 
                receiving_years,
                carency_period 
            });
            
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

                {/* Texto explicativo sobre a Carência */}
                <View style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f8fafc", gap: 6 }}>
                    <Text style={{ fontWeight: "700" }}>O que é a Carência?</Text>
                    <Text style={{ color: "#334155" }}>
                        O período de carência é o tempo (em anos) desde o início do projeto até o início do recebimento das parcelas.
                    </Text>
                    <Text style={{ color: "#334155" }}>
                        Ex: 2 anos de carência e 7 de recebimento significam que o fluxo de caixa começa apenas no 3º ano e dura 7 anos.
                    </Text>
                </View>

                
                {/* Campo de Anos de Recebimento */}
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
                        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fff" }}
                    />
                </View>
                {/* Campo de Carência */}
                <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "600" }}>Anos de Carência *</Text>
                    <InputSpinner
                        value={Number(carency || 0)}
                        onChange={(num) => setCarency(String(num))}
                        min={0} // Permite 0 anos de carência
                        step={1}
                        skin="clean"
                        height={44}
                        buttonFontSize={18}
                        inputStyle={{ fontSize: 16 } as any}
                        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fff" }}
                    />
                </View>

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
                                    marginTop: 10, // Adicionado margin
                                }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Simular</Text>
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