import { useAuth } from "@/context/AuthContext";
import { listAreasByOwner } from "@/services/areas";
import { deleteSimulation, listSimulations } from "@/services/simulations";
import type { Area } from "@/types/area";
import type { Simulation } from "@/types/simulation";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

const msg = (e:any)=> e?.response?.data?.message ?? e?.message ?? "Falha na requisição.";
const money = (n:number)=> `R$ ${Number(n||0).toLocaleString("pt-BR")}`;

export default function SimulationsIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const [sims, setSims] = useState<Simulation[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ()=>{
    try {
      setLoading(true);
      const [s, a] = await Promise.all([
        listSimulations(),
        user?.id ? listAreasByOwner(user.id) : Promise.resolve<Area[]>([])
      ]);
      setAreas(a);
      // filtra pelo conjunto das suas áreas
      const meusAreaIds = new Set(a.map(x=>x.id));
      setSims(s.filter(sim => meusAreaIds.has(sim.area_id)));
    } catch(e:any) {
      Alert.alert("Erro", msg(e));
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(()=>{ load(); }, [load]);
  const onRefresh = async ()=>{ setRefreshing(true); await load(); setRefreshing(false); };

  const areaNome = useCallback((areaId:string)=>{
    return areas.find(a=>a.id===areaId)?.description ?? areaId.slice(0,8);
  }, [areas]);

  const handleDelete = (s: Simulation) => {
    Alert.alert("Confirmar", `Excluir a simulação “${areaNome(s.area_id)}”?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async ()=>{
        try { await deleteSimulation(s.id); setSims(prev => prev.filter(i => i.id !== s.id)); }
        catch(e:any){ Alert.alert("Erro", msg(e)); }
      } }
    ]);
  };

  if (loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;

  return (
    <View style={{ flex:1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: '#007AFF' }}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex:1, padding:16, gap:12 }}>
      <TouchableOpacity
        onPress={()=>router.push("/simulations/select-area")}
        style={{ backgroundColor:"#2563eb", padding:12, borderRadius:10 }}
      >
        <Text style={{ color:"#fff", fontWeight:"700", textAlign:"center" }}>+ Nova Simulação</Text>
      </TouchableOpacity>

      <Text style={{ fontSize:18, fontWeight:"800" }}>Minhas simulações</Text>

      {sims.length === 0 ? (
        <Text>Você ainda não tem simulações.</Text>
      ) : (
        <FlatList
          data={sims}
          keyExtractor={(i)=>i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={{ borderWidth:1, borderColor:"#eee", borderRadius:16, padding:14, marginBottom:10, backgroundColor:"#fff" }}>
              <TouchableOpacity
                onPress={()=>router.push({
                  pathname:"/simulations/[id]",
                  params:{ id:item.id, data: encodeURIComponent(JSON.stringify(item)) }
                })}
              >
                <Text style={{ fontSize:16, fontWeight:"800" }}>Simulação de {areaNome(item.area_id)}</Text>
                <Text style={{ marginTop:4, color:"#334155" }}>Recebimento: {item.receiving_years} {item.receiving_years>1?"anos":"ano"}</Text>
                <Text style={{ color:"#334155" }}>VGV Bruto: {money(item.gross_estimated_value)}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection:"row", gap:12, marginTop:12 }}>
                <TouchableOpacity
                  onPress={()=>router.push({ pathname:"/simulations/edit/[id]", params:{ id:item.id, data: encodeURIComponent(JSON.stringify(item)) } })}
                  style={{ padding:10, backgroundColor:"#f1f5f9", borderRadius:10 }}
                >
                  <Text>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={()=>handleDelete(item)}
                  style={{ padding:10, backgroundColor:"#fee2e2", borderRadius:10 }}
                >
                  <Text style={{ color:"#b91c1c" }}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      </View>
    </View>
  );
}
