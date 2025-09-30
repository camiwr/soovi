import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { createArea } from '../../services/areas';
import { useAuth } from '../../context/AuthContext';   
import { useToast } from '../../components/UI/Toast';

export default function CreateArea() {
  const { user } = useAuth();                           
  const { show } = useToast();

  const [registration, setRegistration] = useState('');
  const [description, setDescription] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [priceM2, setPriceM2] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user?.id) return show('Sessão', 'Você precisa estar logada para cadastrar.', 'info');
    if (!description || !totalArea || !priceM2) {
      return show('Validação', 'Preencha a Descrição, Área total e Valor do m².', 'info');
    }
    try {
      setSaving(true);
      const body = {
        owner_id: user.id,                               
        description: description.trim(),
        total_area_hectare: Number(totalArea),
        registration_number: registration ? registration.trim() : null,
        location: null,                                  
        suggested_lot_price_m2: Number(priceM2),
        lot_size: lotSize ? Number(lotSize) : null,
      };

      console.log('POST /area', body);
      await createArea(body);
      show('Sucesso', 'Área cadastrada', 'success');
      router.back(); 
    } catch (e: any) {
      console.error(e);
      show('Erro', e?.message || 'Falha ao salvar área', 'error');
    } finally {
      setSaving(false);
    }
  }


  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={s.h1}>Cadastrar Área</Text>

      <Labeled value={registration} onChangeText={setRegistration} label="Matrícula (opcional)" />
      <Labeled value={description} onChangeText={setDescription} label="Descrição *" />
      <Labeled value={lotSize} onChangeText={setLotSize} label="Tamanho do lote (m²)" keyboardType="decimal-pad" />
      <Labeled value={totalArea} onChangeText={setTotalArea} label="Área total (hectares) *" keyboardType="decimal-pad" />
      <Labeled value={priceM2} onChangeText={setPriceM2} label="Valor do m² (R$) *" keyboardType="decimal-pad" />

      <TouchableOpacity style={[s.btn, { backgroundColor: '#10B981' }]} onPress={handleSave} disabled={saving}>
        <Text style={s.btnText}>{saving ? 'Salvando...' : 'Salvar Área'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, { backgroundColor: '#6B7280' }]} onPress={() => router.back()}>
        <Text style={s.btnText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Labeled(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'phone-pad';
}) {
  return (
    <>
      <Text style={{ fontWeight: '700', color: '#111827' }}>{props.label}</Text>
      <TextInput
        style={s.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.label}
        keyboardType={props.keyboardType}
      />
    </>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
