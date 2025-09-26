import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { onlyDigits, isPhone } from '../../lib/format';
import { router } from 'expo-router';

export default function ProfileTab() {
  const { user, updateProfile, signOut } = useAuth();
  if (!user) return <View style={s.wrapper}><Text>Carregando...</Text></View>;

  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (phone && !isPhone(phone)) return Alert.alert('Validação', 'Telefone deve ter 10–11 dígitos.');
    try {
      setSaving(true);
      await updateProfile({ name: name.trim(), phone: phone ? onlyDigits(phone) : undefined });
      Alert.alert('Sucesso', 'Perfil atualizado');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Meu Perfil</Text>
      <Text style={s.label}>E-mail: <Text style={s.mono}>{user.email}</Text></Text>
      {user.cpf ? <Text style={s.label}>CPF: <Text style={s.mono}>{user.cpf}</Text></Text> : null}

      <View style={s.inputWrap}><TextInput style={s.input} placeholder="Nome" value={name} onChangeText={setName} /></View>
      <View style={s.inputWrap}><TextInput style={s.input} placeholder="Telefone (DDD+numero)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View>

      <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.btn, { backgroundColor: saving ? '#93C5FD' : '#3B82F6' }]}>
        <Text style={s.btnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignOut} style={[s.btn, { backgroundColor: '#EF4444', marginTop: 8 }]}>
        <Text style={s.btnText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { flex:1, alignItems:'center', justifyContent:'center' },
  container: { flex:1, backgroundColor:'#F8FAFC', padding:16, gap:12 },
  title: { fontSize:22, fontWeight:'700', marginBottom:8, color:'#111827' },
  label: { color:'#374151' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as any },
  inputWrap: { backgroundColor:'#fff', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingHorizontal:16 },
  input: { paddingVertical:14, fontSize:16, color:'#111827' },
  btn: { borderRadius:12, paddingVertical:16, alignItems:'center' },
  btnText: { color:'#fff', fontSize:16, fontWeight:'600' },
});
