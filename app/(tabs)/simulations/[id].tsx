import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { listSimulations, deleteSimulation } from "@/services/simulations";
import { getArea } from "@/services/areas";
import type { Simulation } from "@/types/simulation";
import type { Area } from "@/types/area";

const money = (n:number)=> `R$ ${Number(n||0).toLocaleString("pt-BR")}`;

export default function SimulationDetails(){
  const { id, data } = useLocalSearchParams<{ id:string; data?:string }>();
  const router = useRouter();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async()=>{
    try{
      let s: Simulation | null = null;
      if (data) {
        try { s = JSON.parse(decodeURIComponent(String(data))); } catch {}
      }
      if (!s) {
        // fallback: procura na lista do usuário
        const all = await listSimulations();
        s = all.find(x => x.id === String(id)) ?? null;
      }
      if (!s) throw new Error("Simulação não encontrada.");
      setSim(s);
      setArea(await getArea(s.area_id));
    }catch(e:any){
      Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar.");
    }finally{ setLoading(false); }
  })();}, [id, data]);

  const handleDelete = () => {
    if(!id) return;
    Alert.alert("Confirmar", "Excluir esta simulação?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async ()=>{
        try { await deleteSimulation(String(id)); router.replace("/simulations"); }
        catch(e:any){ Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao excluir."); }
      } }
    ]);
  };

  if(loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;
  if(!sim) return <View style={{ padding:16 }}><Text>Simulação não encontrada.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding:16, gap:10 }}>
      <Text style={{ fontSize:20, fontWeight:"800" }}>Simulação</Text>
      {area ? <Text>Área: {area.description}</Text> : <Text>Área: {sim.area_id}</Text>}
      <Text>Simulada em: {new Date(sim.simulated_at).toLocaleString()}</Text>
      <Text>Recebimento: {sim.receiving_years} {sim.receiving_years>1?"anos":"ano"}</Text>

      <View style={{ marginTop:10, padding:12, borderWidth:1, borderColor:"#eee", borderRadius:10 }}>
        <Text style={{ fontWeight:"800", marginBottom:6 }}>Resultados</Text>
        <Text>VGV Bruto: {money(sim.gross_estimated_value)}</Text>
        <Text>Vendas Totais: {money(sim.total_sales_value)}</Text>
        <Text>Custo de Infra: {money(sim.infra_cost)}</Text>
        <Text>Impostos: {money(sim.tax_cost)}</Text>
        <Text>Comissão: {money(sim.commission_cost)}</Text>
        <Text>Descontos Totais: {money(sim.total_discounts)}</Text>
        <Text>Receita Líquida: {money(sim.net_revenue)}</Text>
        <Text>Saldo do Projeto: {money(sim.project_balance)}</Text>
        <Text>Recebível Anual: {money(sim.annual_receivable)}</Text>
      </View>

      {sim.used_parameters?.infra?.length ? (
        <View style={{ marginTop:10, padding:12, borderWidth:1, borderColor:"#eee", borderRadius:10 }}>
          <Text style={{ fontWeight:"800", marginBottom:6 }}>Parâmetros usados</Text>
          {sim.used_parameters.infra.map((i, idx)=>(
            <Text key={idx}>• {i.type}: R$ {i.unit_value.toLocaleString("pt-BR")} × {i.installments} parcelas</Text>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection:"row", gap:12, marginTop:16 }}>
        <TouchableOpacity
          onPress={()=>router.push({ pathname:"/simulations/edit/[id]", params:{ id:String(id), data: encodeURIComponent(JSON.stringify(sim)) } })}
          style={{ padding:12, backgroundColor:"#f1f5f9", borderRadius:10 }}
        >
          <Text>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{ padding:12, backgroundColor:"#fee2e2", borderRadius:10 }}
        >
          <Text style={{ color:"#b91c1c" }}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
