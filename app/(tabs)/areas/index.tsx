// app/(tabs)/areas/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { listAreasByOwner, deleteArea } from "@/services/areas";
import type { Area } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

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
    try {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      setLoading(true);
      const rows = await listAreasByOwner(user.id);
      setItems(rows);
    } catch (e: any) {
      Alert.alert("Erro", errMsg(e));
      console.log("AREAS LIST ERROR:", e?.response?.status, e?.response?.data);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (area: Area) => {
    Alert.alert("Confirmar", `Excluir a área “${area.description}”?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            if (!user?.id) throw new Error("Usuário não autenticado.");
            await deleteArea(area.id, user.id);
            setItems((prev) => prev.filter((a) => a.id !== area.id));
          } catch (e: any) {
            Alert.alert("Erro", errMsg(e));
            console.log("AREAS DELETE ERROR:", e?.response?.status, e?.response?.data);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/areas/create")}
        style={{ backgroundColor: "#2563eb", padding: 12, borderRadius: 10 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
          + Nova Área
        </Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <Text>Nenhuma área cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isOwner = !!user?.id && item.owner_id === user.id;

            return (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: "/(tabs)/areas/[id]", params: { id: item.id } })
                  }
                >
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.description}</Text>
                  <Text style={{ marginTop: 4 }}>Área total: {item.total_area_hectare} ha</Text>
                  {item.location ? <Text>Localização: {item.location}</Text> : null}
                </TouchableOpacity>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({ pathname: "/(tabs)/areas/edit/[id]", params: { id: item.id } })
                    }
                    style={{
                      padding: 10,
                      backgroundColor: isOwner ? "#f1f5f9" : "#e5e7eb",
                      borderRadius: 8,
                    }}
                    disabled={!isOwner}
                  >
                    <Text style={{ color: isOwner ? "#000" : "#9ca3af" }}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={{
                      padding: 10,
                      backgroundColor: isOwner ? "#fee2e2" : "#e5e7eb",
                      borderRadius: 8,
                    }}
                    disabled={!isOwner}
                  >
                    <Text style={{ color: isOwner ? "#b91c1c" : "#9ca3af" }}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
