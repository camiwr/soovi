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
      setItems([...rows]); // Força a atualização do estado
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
          <View style={s.card}>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/(tabs)/areas/[id]", params: { id: item.id } })
              }
            >
              <Text style={s.cardTitle}>{item.description}</Text>
              <Text style={s.cardInfo}>Área total: {item.total_area_hectare} ha</Text>
              <Text style={s.cardInfo}>Tamanho do lote: {item.lot_size}</Text>
              {item.location ? <Text style={s.cardInfo}>Local: {item.location}</Text> : null}
            </TouchableOpacity>
          </View>
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
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  cardTitle: { 
    fontSize: 16, fontWeight: "700" 
  },
  cardInfo: { 
    marginTop: 4, color: "#374151"
  },
});