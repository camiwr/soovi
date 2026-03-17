import { useAuth } from "@/context/AuthContext";
import { listAreasByOwner } from "@/services/areas";
import type { Area } from "@/types/area";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function errMsg(e: any) {
  return e?.response?.data?.message ?? e?.message ?? "Falha na requisição.";
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
  return `${size.width} x ${size.height} = ${area} m²`;
}

export default function AreasIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const startTime = Date.now(); // Início do tempo
    try {
      if (!user?.id) {
         setItems([]);
         return;
      }
      setLoading(true);
      // Chama a listagem passando o ID do usuário
      const rows = await listAreasByOwner(user.id, { timestamp: Date.now() }); // Adiciona um parâmetro único para evitar cache
      console.log("Dados retornados pela API:", rows); // Log dos dados retornados
      // Suporte temporário: aceite tanto camelCase (API antiga) quanto snake_case (app)
      const safe = rows.map((r: any) => ({
        ...r,
        total_area_hectare: r.total_area_hectare ?? r.totalAreaHectare ?? r.totalArea ?? r.totalAreaHa,
        lot_size: r.lot_size ?? r.lotSize,
        created_at: r.created_at ?? r.createdAt,
        location: r.location ?? (r.address ? `${r.address.street ?? ""} ${r.address.number ?? ""} ${r.address.city ?? ""}`.trim() : r.location),
      }));
      setItems([...safe]); // Força a atualização do estado
    } catch (e: any) {
      Alert.alert("Erro ao Listar Áreas", errMsg(e));
    } finally {
      setLoading(false);
      const endTime = Date.now(); // Fim do tempo
      console.log(`Tempo para carregar a lista: ${endTime - startTime}ms`); // Log do tempo
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/areas/create")}
        style={s.primaryButton}
      >
        <Text style={s.primaryButtonText}>
          + Nova Área
        </Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        onPress={load}
        style={[s.primaryButton, { backgroundColor: "#4CAF50" }]} 
      >
        <Text style={s.primaryButtonText}>Recarregar Lista</Text>
      </TouchableOpacity> */}


      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.emptyText}>Nenhuma área cadastrada.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push({ pathname: "/(tabs)/areas/[id]", params: { id: item.id } })}
          >
            <View style={s.cardRow}>
              <Text numberOfLines={2} style={s.cardTitle}>{item.description}</Text>
              <View style={s.meta}>
                <Text style={s.metaText}>{item.total_area_hectare ? `${item.total_area_hectare} ha` : ""}</Text>
                <Text style={s.metaSub}>{item.lot_size ? formatLotSize(item.lot_size) : ""}</Text>
              </View>
            </View>
            {item.location ? <Text style={s.location}>{item.location}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Estilos
const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16, gap: 12 },
  primaryButton: { 
    backgroundColor: "#2563eb", padding: 12, borderRadius: 10 
  },
  primaryButtonText: { 
    color: "#fff", fontWeight: "700", textAlign: "center" 
  },
  emptyText: { 
    textAlign: "center", marginTop: 20, color: "#6B7280"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  meta: { alignItems: "flex-end" },
  metaText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  metaSub: { fontSize: 12, color: "#6B7280" },
  location: { marginTop: 8, color: "#6B7280", fontSize: 13 },
});