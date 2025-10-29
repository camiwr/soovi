import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { listAreasByOwner } from "@/services/areas";
import type { Area } from "@/types/area";

export default function SelectAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async()=>{
    try{
      if(!user?.id) throw new Error("Usuário não autenticado.");
      setAreas(await listAreasByOwner(user.id));
    }catch(e:any){ Alert.alert("Erro", e?.message ?? "Falha ao carregar áreas."); }
    finally{ setLoading(false); }
  })();}, [user?.id]);

  if (loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;

  return (
    <View style={{ flex:1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ fontSize: 24, color: '#007AFF' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16 }}>Selecionar Área</Text>
      </View>
      <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:"800", marginBottom:12 }}>Escolha uma área para simular</Text>

      <FlatList
        data={areas}
        keyExtractor={(i)=>i.id}
        renderItem={({ item }) => (
          <View style={{ borderWidth:1, borderColor:"#eee", borderRadius:10, padding:12, marginBottom:10, backgroundColor:"#fff" }}>
            <Text style={{ fontSize:16, fontWeight:"700" }}>{item.description}</Text>
            <Text>Área total: {item.total_area_hectare} ha</Text>
            {item.location ? <Text>Localização: {item.location}</Text> : null}

            <TouchableOpacity
              onPress={()=>router.push({ pathname:"/simulations/create", params:{ areaId: item.id } })}
              style={{ marginTop:10, backgroundColor:"#2563eb", padding:10, borderRadius:8 }}
            >
              <Text style={{ color:"#fff", textAlign:"center", fontWeight:"700" }}>
                Simular a partir desta área
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>Você ainda não tem áreas cadastradas.</Text>}
      />
    </View>
    </View>
  );
}
