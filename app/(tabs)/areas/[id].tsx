import { useAuth } from "@/context/AuthContext";
import { deleteArea, getArea } from "@/services/areas";
import type { Area } from "@/types/area";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Função helper para tratar mensagens de erro
function errMsg(e: any) {
  const msg = e?.response?.data?.message;
  if (msg) {
    return Array.isArray(msg) ? msg.join('\n') : String(msg);
  }
  return e?.message ?? "Falha na requisição.";
}

// Função para formatar o tamanho do lote
function formatLotSize(lotSize: string): string {
  const sizes: Record<string, { width: number; height: number }> = {
    TENx20: { width: 10, height: 20 },
    TENx30: { width: 10, height: 30 },
  };

  const size = sizes[lotSize];
  if (!size) return lotSize;

  const area = size.width * size.height;
  return `${area} m²`;
}

export default function AreaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth(); // Pega o usuário logado
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para buscar os dados da área
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getArea(String(id));
        setArea(data);
      } catch (e: any) {
        Alert.alert("Erro", errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Verifica se o usuário logado é o dono da área
  const isOwner = !!area && !!user?.id && area.owner_id === user.id;

  // Função de Deletar
  const handleDelete = () => {
    // Validação extra
    if (!isOwner || !id || !user?.id) {
      Alert.alert("Atenção", "Você não tem permissão para esta ação ou não está logado.");
      return;
    }

    Alert.alert("Confirmar Exclusão", "Deseja realmente excluir esta área?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try {
            // CORREÇÃO: Passa o 'id' da área e o 'user.id' (owner_id)
            await deleteArea(String(id), user.id);

            Alert.alert("Sucesso", "Área excluída");
            router.replace("/(tabs)/areas"); // Volta para a lista
          } catch (e: any) {
            Alert.alert("Erro ao Excluir", errMsg(e));
          }
        }
      }
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator /></View>;
  if (!area) return <View style={s.container}><Text>Área não encontrada.</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>{area.description}</Text>

      <View style={s.infoBox}>
        <Text style={s.infoLabel}>Área Total</Text>
        <Text style={s.infoValue}>{area.total_area_hectare} hectares</Text>
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoLabel}>Tamanho do Lote</Text>
        <Text style={s.infoValue}>{formatLotSize(area.lot_size)}</Text>
      </View>

      {area.registration_number && (
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Matrícula</Text>
          <Text style={s.infoValue}>{area.registration_number}</Text>
        </View>
      )}

      {area.location && (
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Localização</Text>
          <Text style={s.infoValue}>{area.location}</Text>
        </View>
      )}

      {area.suggested_lot_price != null && (
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Valor Sugerido (Lote)</Text>
          <Text style={s.infoValue}>R$ {area.suggested_lot_price.toLocaleString('pt-BR')}</Text>
        </View>
      )}

      <Text style={s.date}>Criada em: {new Date(area.created_at).toLocaleString()}</Text>

      {/* Botões de Ação */}
      <View style={s.buttonRow}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/areas/edit/[id]", params: { id: area.id } })}
          style={[s.button, s.editButton, !isOwner && s.disabledButton]}
          disabled={!isOwner}
        >
          <Text style={[s.buttonText, s.editText, !isOwner && s.disabledText]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={[s.button, s.deleteButton, !isOwner && s.disabledButton]}
          disabled={!isOwner}
        >
          <Text style={[s.buttonText, s.deleteText, !isOwner && s.disabledText]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  infoBox: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb'
  },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  date: { color: "#64748b", marginTop: 8, fontSize: 12 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButton: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: '#e5e7eb' },
  editText: { color: "#000", fontWeight: '600' },
  deleteButton: { backgroundColor: "#fee2e2" },
  deleteText: { color: "#b91c1c", fontWeight: '600' },
  disabledButton: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: '#e5e7eb' },
  disabledText: { color: "#9ca3af" },
  buttonText: { fontSize: 15 },
});