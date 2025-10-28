import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getArea, deleteArea } from "@/services/areas";
import type { Area } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

function msg(err: any) { return err?.response?.data?.message ?? err?.message ?? "Falha na requisição."; }

export default function AreaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth(); 
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isOwner = !!area && !!user?.id && area.owner_id === user.id;

  const handleDelete = () => {
    if (!isOwner) {
      Alert.alert("Permissão", "Você não é o proprietário desta área.");
      return;
    }
    Alert.alert("Confirmar", "Deseja excluir esta área?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await deleteArea(String(id), user!.id);
            Alert.alert("Sucesso", "Área excluída");
            router.replace("/(tabs)/areas");
          } catch (e: any) {
            Alert.alert("Erro", msg(e));
            console.log("AREAS DELETE ERROR:", e?.response?.status, e?.response?.data);
          }
        }
      }
    ]);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
  if (!area) return <View style={{ padding: 16 }}><Text>Área não encontrada.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>{area.description}</Text>
      <Text>Área total: {area.total_area_hectare} ha</Text>
      {area.registration_number ? <Text>Matrícula: {area.registration_number}</Text> : null}
      {area.location ? <Text>Localização: {area.location}</Text> : null}
      {area.lot_size != null ? <Text>Tamanho do lote: {area.lot_size} m²</Text> : null}
      <Text style={{ color: "#64748b", marginTop: 8 }}>Criada em: {new Date(area.created_at).toLocaleString()}</Text>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/areas/edit/[id]", params: { id: area.id } })}
          style={{ padding: 12, backgroundColor: isOwner ? "#f1f5f9" : "#e5e7eb", borderRadius: 10 }}
          disabled={!isOwner}
        >
          <Text style={{ color: isOwner ? "#000" : "#9ca3af" }}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={{ padding: 12, backgroundColor: isOwner ? "#fee2e2" : "#e5e7eb", borderRadius: 10 }}
          disabled={!isOwner}
        >
          <Text style={{ color: isOwner ? "#b91c1c" : "#9ca3af" }}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
