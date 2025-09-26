import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, Alert, StyleSheet, View } from 'react-native';
import { createArea } from '../../services/areas';

export default function AreaCreateTab() {
  const [description, setDescription] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [registration, setRegistration] = useState('');
  const [location, setLocation] = useState('');
  const [priceM2, setPriceM2] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      const payload: any = {};
      if (description) payload.description = description;
      if (totalArea) payload.total_area_hectare = Number(totalArea);
      if (registration) payload.registration_number = registration;
      if (location) payload.location = location;
      if (priceM2) payload.suggested_lot_price_m2 = Number(priceM2);
      if (lotSize) payload.lot_size = Number(lotSize);

      await createArea(payload);
      Alert.alert('Sucesso', 'Área cadastrada');
      setDescription(''); setTotalArea(''); setRegistration(''); setLocation(''); setPriceM2(''); setLotSize('');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao cadastrar área');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ gap:12, paddingBottom:24 }}>
      <Text style={s.title}>Cadastrar Área</Text>
      <View style={s.inputWrap}><TextInput style={s.input} value={description} onChangeText={setDescription} placeholder="Descrição" /></View>
      <View style={s.inputWrap}><TextInput style={s.input} value={totalArea} onChangeText={setTotalArea} keyboardType="decimal-pad" placeholder="Área total (hectares)" /></View>
      <View style={s.inputWrap}><TextInput style={s.input} value={registration} onChangeText={setRegistration} placeholder="Matrícula/Registro" /></View>
      <View style={s.inputWrap}><TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="Localização" /></View>
      <View style={s.inputWrap}><TextInput style={s.input} value={priceM2} onChangeText={setPriceM2} keyboardType="decimal-pad" placeholder="Preço sugerido m²" /></View>
      <View style={s.inputWrap}><TextInput style={s.input} value={lotSize} onChangeText={setLotSize} keyboardType="decimal-pad" placeholder="Tamanho do lote" /></View>

      <TouchableOpacity onPress={submit} disabled={loading} style={[s.btn, { backgroundColor: loading ? '#93C5FD' : '#34C759' }]}>
        <Text style={s.btnText}>{loading ? 'Salvando...' : 'Salvar área'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:16 },
  title: { fontSize:22, fontWeight:'700', marginBottom:8, color:'#111827' },
  inputWrap: { backgroundColor:'#fff', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingHorizontal:16 },
  input: { paddingVertical:14, fontSize:16, color:'#111827' },
  btn: { borderRadius:12, paddingVertical:16, alignItems:'center', marginTop:12 },
  btnText: { color:'#fff', fontSize:16, fontWeight:'600' },
});
