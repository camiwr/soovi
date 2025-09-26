import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../lib/http';

// tipo opcional p/ atividades
type Activity = {
  id: string;
  type: 'simulation' | 'area';
  title: string;
  created_at: string; // ISO
};

// tenta buscar de /activities; se não existir, retorna []
async function fetchActivities(): Promise<Activity[]> {
  try {
    const data = await request<Activity[]>('/activities', { auth: true });
    // normalização mínima: garanta campos
    return (Array.isArray(data) ? data : []).slice(0, 5);
  } catch {
    return []; // sem ruído se o back ainda não tiver isso
  }
}

export default function Home() {
  const { user } = useAuth();
  const firstName = useMemo(() => (user?.name || '').split(' ')[0] || 'Usuário', [user?.name]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await fetchActivities();
      setActivities(list);
      setLoading(false);
    })();
  }, []);

  function handleNewSimulation() {
    Alert.alert('Nova Simulação', 'Tela de criação de simulação em breve.');
  }

  function handleNovaArea() {
    router.push('/areas/create');
  }

  function handleMyAreas() {
    router.push('/(tabs)/areas');
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }}>
      <Text style={s.h1}>Olá, {firstName}!</Text>
      <Text style={s.subtitle}>O que você gostaria de fazer hoje?</Text>

      <TouchableOpacity style={s.bigCard} onPress={handleNovaArea}>
        <View style={s.plusCircle}><Text style={s.plusText}>＋</Text></View>
        <Text style={s.bigTitle}>Nova Área</Text>
        <Text style={s.bigDesc}>Criar uma nova área</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.card} onPress={handleMyAreas}>
        <View style={s.iconCircle}><Text style={{fontSize:18}}>📍</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Minhas Áreas</Text>
          <Text style={s.cardDesc}>Visualizar áreas cadastradas</Text>
        </View>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Últimas Atividades</Text>

      {loading ? (
        <Text style={s.muted}>Carregando...</Text>
      ) : activities.length === 0 ? (
        <Text style={s.muted}>Sem atividades recentes.</Text>
      ) : (
        <View style={{ gap: 12, width: '100%' }}>
          {activities.map((a) => (
            <View key={a.id} style={s.activityItem}>
              <View style={s.activityIcon}>
                <Text style={{ fontSize:16 }}>{a.type === 'simulation' ? '📊' : '🗺️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.activityTitle}>{a.title}</Text>
                <Text style={s.activityTime}>{formatRelative(a.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return `Há ${diffDays} dias`;
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F8FAFC', padding:16 },
  h1: { fontSize:28, fontWeight:'800', color:'#0F172A', marginTop:8, textAlign:'center' },
  subtitle: { fontSize:16, color:'#64748B', marginBottom:16, textAlign:'center' },

  bigCard: {
    backgroundColor:'#3B82F6', borderRadius:16, padding:20,
    alignItems:'center', justifyContent:'center', gap:8, marginBottom:16, width:'100%'
  },
  plusCircle: {
    width:54, height:54, borderRadius:27, backgroundColor:'#60A5FA33',
    alignItems:'center', justifyContent:'center', marginBottom:8
  },
  plusText: { color:'#fff', fontSize:30, lineHeight:30 },
  bigTitle: { color:'#fff', fontSize:20, fontWeight:'800', textAlign:'center' },
  bigDesc: { color:'#E0F2FE', textAlign:'center' },

  card: {
    backgroundColor:'#FFFFFF', borderRadius:16, padding:16,
    borderWidth:1, borderColor:'#E5E7EB', flexDirection:'row', gap:12, alignItems:'center', width:'100%'
  },
  iconCircle: {
    width:44, height:44, borderRadius:22, backgroundColor:'#F1F5F9',
    alignItems:'center', justifyContent:'center'
  },
  cardTitle: { fontSize:18, fontWeight:'700', color:'#111827', textAlign:'center' },
  cardDesc: { color:'#6B7280', textAlign:'center' },

  sectionTitle: { fontSize:20, fontWeight:'800', color:'#111827', marginTop:24, marginBottom:8, textAlign:'center' },
  muted: { color:'#6B7280', textAlign:'center' },

  activityItem: {
    backgroundColor:'#FFFFFF', borderRadius:16, padding:14,
    borderWidth:1, borderColor:'#E5E7EB', flexDirection:'row', gap:12, alignItems:'center'
  },
  activityIcon: {
    width:36, height:36, borderRadius:18, backgroundColor:'#F1F5F9',
    alignItems:'center', justifyContent:'center'
  },
  activityTitle: { fontSize:16, fontWeight:'700', color:'#111827', textAlign:'center' },
  activityTime: { color:'#6B7280', marginTop:2, textAlign:'center' },
});
