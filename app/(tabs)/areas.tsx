import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useConfirm } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { getToken } from '../../lib/session';
import { Area, deleteArea, getArea, searchAreas, updateArea } from '../../services/areas';

export default function AreasScreen() {
  const { user, signOut } = useAuth();
  const { show } = useToast();
  const { confirm } = useConfirm();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<Area | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Area>>({});

  const load = useCallback(async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado');
      setAreas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Carregando áreas para usuário:', user.id);

      const token = await getToken();
      console.log('Token presente:', !!token);
      if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
      }

      const data = await searchAreas({
        owner_id: user.id,
        limit: 50,
        page: 1
      });

      console.log('Resposta da API - Tipo:', typeof data);
      console.log('Resposta da API - Total de áreas na resposta:', data.total || 0);

      const realAreas = Array.isArray(data.areas) ? data.areas : [];
      console.log('Áreas extraídas:', realAreas.length);

      if (realAreas.length > 0) {
        console.log('Primeira área:', JSON.stringify(realAreas[0], null, 2));
      }

      const sortedAreas = realAreas.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setAreas(sortedAreas);

    } catch (e: any) {
      console.log('AREAS SEARCH ERROR:', e?.data || e?.message || e);

      if (e?.statusCode === 403 || e?.status === 403 || e?.message === 'INVALID_TOKEN') {
        show('🔐 Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.', 'error');
        await signOut();
        router.replace('/(auth)/login');
        setAreas([]);
        setLoading(false);
        return;
      }

      // Para outros erros, mostra mensagem genérica
      if (e?.message && !e?.message.includes('404') && !e?.message.includes('Network')) {
        Alert.alert(
          'Erro ao carregar áreas',
          'Não foi possível carregar suas áreas. Verifique sua conexão e tente novamente.',
          [{ text: 'OK' }]
        );
      }

      // Em caso de erro, define array vazio (sem áreas)
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);


  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function openModal(a: Area) {
    try {
      const full = await getArea(a.id);
      setSelected(full);
      setForm(full);
      setEditing(false);
    } catch (error) {
      console.log('Erro ao carregar detalhes da área:', error);
      setSelected(a);
      setForm(a);
      setEditing(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await updateArea(selected.id, {
        owner_id: selected.owner_id,                               // <- obrigatório p/ autorização
        description: form.description,
        registration_number: form.registration_number,
        total_area_hectare: form.total_area_hectare,
        suggested_lot_price_m2: form.suggested_lot_price_m2,
        lot_size: form.lot_size,
      });
      show('Sucesso', 'Área atualizada', 'success');
      setSelected(null);
      load();
    } catch (e: any) {
      show('Erro', e?.message || 'Falha ao atualizar', 'error');
    }
  }

  function handleDelete() {
    if (!selected) {
      console.log('handleDelete: Nenhuma área selecionada');
      return;
    }
    const area = selected;
    console.log('handleDelete: Área selecionada para exclusão:', area);
    setSelected(null); // fecha o modal primeiro
    setTimeout(() => {
      console.log('handleDelete: Abrindo confirmação de exclusão');
      confirm({
        title: 'Remover área?',
        message: 'Essa ação não pode ser desfeita.',
        confirmText: 'Remover',
        onConfirm: async () => {
          console.log('handleDelete: Confirmação recebida, excluindo área:', area.id);
          try {
            await deleteArea(area.id);
            console.log('handleDelete: Área excluída com sucesso');
            show('Removida', 'A área foi excluída.', 'success');
            load();
          } catch (e: any) {
            console.log('handleDelete: Erro ao excluir área:', e?.message || e);
            show('Erro', e?.message || 'Falha ao deletar', 'error');
          }
        },
      });
    }, 30);
  }


  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header centralizado com botão de adicionar */}
      <View style={s.header}>
        <View style={s.headerContent}>
          <Text style={s.h1}>Minhas Áreas</Text>
          <TouchableOpacity onPress={() => router.push('/areas/create')} style={s.addBtn}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 22 }}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={s.loadingContainer}>
            <Text style={s.loadingText}>🔄 Carregando suas áreas...</Text>
          </View>
        ) : !user?.id ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>🔒</Text>
            <Text style={s.emptyTitle}>Usuário não autenticado</Text>
            <Text style={s.emptySubtitle}>Faça login para ver suas áreas</Text>
          </View>
        ) : areas.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>🏞️</Text>
            <Text style={s.emptyTitle}>Suas áreas aparecerão aqui</Text>
            <Text style={s.emptySubtitle}>Comece criando sua primeira área!</Text>
            <TouchableOpacity
              style={s.createFirstAreaBtn}
              onPress={() => router.push('/areas/create')}
            >
              <Text style={s.createFirstAreaText}>➕ Criar primeira área</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.areasContainer}>
            {areas.map((a) => (
              <TouchableOpacity key={a.id} style={s.card} onPress={() => openModal(a)}>
                <View style={s.cardHeader}>
                  <View style={s.cardIcon}>
                    <Text style={s.cardIconText}>🗺️</Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle}>{a.description || 'Sem descrição'}</Text>
                    {a.registration_number ? <Text style={s.muted}>Matrícula: {a.registration_number}</Text> : null}
                  </View>
                </View>

                <View style={s.row}>
                  <View style={s.statItem}>
                    <Text style={s.muted}>Área Total</Text>
                    <Text style={s.value}>{fmtNum(a.total_area_hectare)} m²</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.muted}>Valor/m²</Text>
                    <Text style={s.value}>R$ {fmtNum(a.suggested_lot_price_m2)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de visualizar/editar */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Detalhes da Área</Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalContent}>

            <LabeledInput
              label="Descrição"
              value={String(form.description ?? '')}
              editable={editing}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <LabeledInput
              label="Matrícula"
              value={String(form.registration_number ?? '')}
              editable={editing}
              onChangeText={(v) => setForm({ ...form, registration_number: v })}
            />
            <LabeledInput
              label="Área total (m²)"
              value={form.total_area_hectare != null ? String(form.total_area_hectare) : ''}
              editable={editing}
              keyboardType="decimal-pad"
              onChangeText={(v) => setForm({ ...form, total_area_hectare: v ? Number(v) : undefined })}
            />
            <LabeledInput
              label="Valor por m² (R$)"
              value={form.suggested_lot_price_m2 != null ? String(form.suggested_lot_price_m2) : ''}
              editable={editing}
              keyboardType="decimal-pad"
              onChangeText={(v) => setForm({ ...form, suggested_lot_price_m2: v ? Number(v) : undefined })}
            />
            <LabeledInput
              label="Tamanho do lote (m²)"
              value={form.lot_size != null ? String(form.lot_size) : ''}
              editable={editing}
              keyboardType="decimal-pad"
              onChangeText={(v) => setForm({ ...form, lot_size: v ? Number(v) : undefined })}
            />

            <View style={s.buttonContainer}>
              {editing ? (
                <TouchableOpacity style={[s.btn, s.saveBtn]} onPress={handleSave}>
                  <Text style={s.btnText}>💾 Salvar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, s.editBtn]} onPress={() => setEditing(true)}>
                  <Text style={s.btnText}>✏️ Editar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.btn, s.deleteBtn]} onPress={handleDelete}>
                <Text style={s.btnText}>🗑️ Excluir</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  editable?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'phone-pad' | 'email-address';
  onChangeText?: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: '700', color: '#111827' }}>{props.label}</Text>
      <TextInput
        style={[
          s.input,
          !props.editable && { backgroundColor: '#F3F4F6' },
        ]}
        value={props.value}
        editable={props.editable}
        keyboardType={props.keyboardType}
        onChangeText={props.onChangeText}
        placeholder={props.label}
      />
    </View>
  );
}

function fmtNum(n?: number) {
  if (n == null || Number.isNaN(n)) return '-';
  return String(n).replace('.', ',');
}

const s = StyleSheet.create({
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  h1: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  loadingContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  loadingText: { textAlign: 'center', color: '#6B7280', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  createFirstAreaBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 8 },
  createFirstAreaText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },

  areasContainer: { width: '100%', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  muted: { color: '#6B7280', fontSize: 14 },
  row: { flexDirection: 'row', gap: 20, marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },

  value: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4, textAlign: 'center' },

  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 20, color: '#6B7280' },
  modalContent: { padding: 16, gap: 16 },

  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16 },

  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveBtn: { backgroundColor: '#10B981' },
  editBtn: { backgroundColor: '#3B82F6' },
  deleteBtn: { backgroundColor: '#EF4444' },
});