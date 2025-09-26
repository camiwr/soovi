import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Simulations() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Simulações</Text>
      <Text style={s.text}>Aqui você verá suas simulações. (Em breve)</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:16 },
  title: { fontSize:22, fontWeight:'800', color:'#111827', marginBottom:8 },
  text: { color:'#6B7280' },
});
