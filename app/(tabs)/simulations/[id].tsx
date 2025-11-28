import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getArea } from "@/services/areas";
import { deleteSimulation, listSimulations } from "@/services/simulations";
import type { Area } from "@/types/area";
import type { Simulation } from "@/types/simulation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const money = (n:number)=> `R$ ${Number(n||0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Table = ({ data }: { data: { label: string; value: string }[] }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ borderWidth: 1, borderColor: colors.tint, borderRadius: 8, overflow: 'hidden' }}>
      {data.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', backgroundColor: index % 2 === 0 ? colors.background : '#f9f9f9' }}>
          <View style={{ flex: 2, padding: 12, borderRightWidth: 1, borderRightColor: colors.tint }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{row.label}</Text>
          </View>
          <View style={{ flex: 1, padding: 12, justifyContent: 'center', alignItems: 'flex-end' }}>
            <Text style={{ color: colors.text, textAlign: 'right' }}>{row.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function SimulationDetails(){
  const { id, data } = useLocalSearchParams<{ id:string; data?:string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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

  if(loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center", backgroundColor: colors.background}}><ActivityIndicator color={colors.tint}/></View>;
  if(!sim) return <View style={{ padding:16, backgroundColor: colors.background }}><Text style={{ color: colors.text }}>Simulação não encontrada.</Text></View>;

  const resultsData = [
    { label: 'VGV Bruto', value: money(sim.gross_estimated_value) },
    { label: 'Custo de Infra', value: money(sim.infra_cost) },
    { label: 'Impostos', value: money(sim.tax_cost) },
    { label: 'Comissão', value: money(sim.commission_cost) },
    { label: 'Descontos Totais', value: money(sim.total_discounts) },
    { label: 'Receita Líquida', value: money(sim.net_revenue) },
    { label: 'Recebível Anual', value: money(sim.annual_receivable) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ fontSize: 24, color: '#000' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16, color: '#000' }}>Detalhes da Simulação</Text>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ marginBottom: 20, padding: 16, backgroundColor: '#f0f8ff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 }}>Simulação</Text>
          <Text style={{ fontSize: 16, color: colors.text }}>Área: {area ? area.description : sim.area_id}</Text>
          <Text style={{ fontSize: 16, color: colors.text }}>Simulada em: {new Date(sim.simulated_at).toLocaleString()}</Text>
          <Text style={{ fontSize: 16, color: colors.text }}>Recebimento: {sim.receiving_years} {sim.receiving_years > 1 ? "anos" : "ano"}</Text>
        </View>

        <View style={{ marginBottom: 20, padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>Resultados</Text>
          <Table data={resultsData} />
        </View>

        {sim.used_parameters?.infra?.length ? (
          <View style={{ marginBottom: 20, padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 }}>Parâmetros Usados</Text>
            <View style={{ borderWidth: 1, borderColor: colors.tint, borderRadius: 8, overflow: 'hidden' }}>
              {sim.used_parameters.infra.map((i, idx) => (
                <View key={idx} style={{ flexDirection: 'row', padding: 12, backgroundColor: idx % 2 === 0 ? colors.background : '#f9f9f9', borderBottomWidth: idx < sim.used_parameters!.infra.length - 1 ? 1 : 0, borderBottomColor: colors.tint }}>
                  <Text style={{ flex: 1, fontWeight: '600', color: colors.text }}>{i.type}</Text>
                  <Text style={{ flex: 1, color: colors.text }}>R$ {i.unit_value.toLocaleString("pt-BR")} | {i.installments} parcelas</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/simulations/edit/[id]", params: { id: String(id), data: encodeURIComponent(JSON.stringify(sim)) } })}
            style={{ padding: 12, backgroundColor: colors.tint, borderRadius: 10, flex: 1, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ padding: 12, backgroundColor: "#dc2626", borderRadius: 10, flex: 1, alignItems: 'center' }}
          >
            <Text style={{ color: "#fff", fontWeight: '600' }}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
