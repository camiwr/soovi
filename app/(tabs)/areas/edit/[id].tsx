import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AreaForm from "@/components/areas/AreaForm";
import { getArea, updateArea } from "@/services/areas";
import type { Area } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

function msg(err: any) { return err?.response?.data?.message ?? err?.message ?? "Falha na requisição."; }

export default function EditAreaScreen() {
    // 🔹 TODOS os hooks no topo, ordem fixa:
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [area, setArea] = useState<Area | null>(null);
    const draftRef = useRef<any>({});

    useEffect(() => {
        (async () => {
            try {
                const data = await getArea(String(id));
                setArea(data);
            } catch (e: any) {
                Alert.alert("Erro", msg(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        // se carregou e não é dono, avisa e sai
        if (!loading && area && user?.id && area.owner_id !== user.id) {
            Alert.alert("Permissão", "Você não é o proprietário desta área.");
            router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: String(id) } });
        }
    }, [loading, area, user?.id, router, id]);

    const onChange = (data: any) => { draftRef.current = data; };

    const onSubmit = async () => {
        try {
            if (!user?.id) {
                Alert.alert("Sessão", "Faça login novamente.");
                return;
            }
            const payload = draftRef.current;
            if (!payload?.description || !payload?.total_area_hectare) {
                Alert.alert("Atenção", "Preencha descrição e área total (ha).");
                return;
            }
            const updated = await updateArea(String(id), payload, user.id);
            Alert.alert("Sucesso", "Área atualizada!");
            router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: updated.id } });
        } catch (e: any) {
            Alert.alert("Erro", msg(e));
            console.log("AREAS UPDATE ERROR:", e?.response?.status, e?.response?.data);
        }
    };

    if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
    if (!area) return <View style={{ padding: 16 }}><Text>Área não encontrada.</Text></View>;

    return (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <AreaForm
                initial={{
                    description: area.description,
                    total_area_hectare: area.total_area_hectare,
                    registration_number: area.registration_number ?? "",
                    location: area.location ?? "",
                    lot_size: typeof area.lot_size === "number"
                        ? area.lot_size
                        : (typeof area.lot_size === "string" && (area.lot_size as string).trim() !== ""
                            ? (isNaN(Number(area.lot_size as string)) ? undefined : Number(area.lot_size as string))
                            : undefined),
                }}
                onChange={onChange}
            />
            <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: "#2563eb", padding: 14, borderRadius: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Salvar alterações</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
