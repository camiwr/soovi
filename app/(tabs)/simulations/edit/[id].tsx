import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator, View, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateSimulation, listSimulations } from "@/services/simulations";

export default function EditSimulationScreen(){
  const { id, data } = useLocalSearchParams<{ id:string; data?:string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState("5");

  useEffect(()=>{(async()=>{
    try{
      if (data) {
        const s = JSON.parse(decodeURIComponent(String(data)));
        setYears(String(s.receiving_years ?? 5));
      } else {
        const s = (await listSimulations()).find(x=>x.id===String(id));
        setYears(String(s?.receiving_years ?? 5));
      }
    }catch(e:any){ Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao carregar."); }
    finally{ setLoading(false); }
  })();}, [id, data]);

  const onSubmit = async ()=>{
    try{
      await updateSimulation(String(id), { receiving_years: Math.max(1, parseInt(years||"5",10)) });
      Alert.alert("Sucesso", "Simulação atualizada!");
      router.replace({ pathname:"/simulations/[id]", params:{ id:String(id) } });
    }catch(e:any){
      Alert.alert("Erro", e?.response?.data?.message ?? e?.message ?? "Falha ao atualizar.");
    }
  };

  if(loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;

  return (
    <ScrollView contentContainerStyle={{ padding:16, gap:12 }}>
      <Text style={{ fontWeight:"800", fontSize:16, marginBottom:4 }}>Editar anos de recebimento</Text>
      <Text>Anos de recebimento *</Text>
      <TextInput
        value={years}
        onChangeText={setYears}
        keyboardType="number-pad"
        style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, backgroundColor:"#fff", padding:10, fontSize:16 }}
        placeholder="5"
      />

      {
        (() => {
          const SaveButton: React.FC = () => {
            const [saving, setSaving] = React.useState(false);
            const handlePress = async () => {
              try {
                setSaving(true);
                await onSubmit();
              } finally {
                setSaving(false);
              }
            };
            return (
              <TouchableOpacity
                onPress={handlePress}
                disabled={saving}
                style={{
                  backgroundColor: "#2563eb",
                  padding: 14,
                  borderRadius: 10,
                  marginTop: 10,
                  opacity: saving ? 0.8 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
                    Salvar alterações
                  </Text>
                )}
              </TouchableOpacity>
            );
          };
          return <SaveButton />;
        })()
      }
    </ScrollView>
  );
}
