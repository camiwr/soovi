import React, { useEffect, useState } from "react";
import {
  View, Text, ActivityIndicator, Alert,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, TextInput
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getArea, updateArea } from "@/services/areas";
import type { Area, UpdateAreaDTO } from "@/types/area";
import { useAuth } from "@/context/AuthContext";

function errMsg(e: any) {
  const msg = e?.response?.data?.message;
  if (msg) {
    return Array.isArray(msg) ? msg.join('\n') : String(msg);
  }
  return e?.message ?? "Falha na requisição.";
}

const LotSizeButton: React.FC<{
  label: string;
  value: string;
  current: string;
  onPress: (value: string) => void;
}> = ({ label, value, current, onPress }) => {
  const isSelected = value === current;
  return (
    <TouchableOpacity
      style={[s.lotButton, isSelected && s.lotButtonSelected]}
      onPress={() => onPress(value)}
    >
      <Text style={[s.lotButtonText, isSelected && s.lotButtonTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function EditAreaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Carregando dados iniciais
  const [saving, setSaving] = useState(false); // Salvando
  const [area, setArea] = useState<Area | null>(null); // Para verificar posse

  // Estados do formulário
  const [description, setDescription] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [registration, setRegistration] = useState("");
  const [location, setLocation] = useState("");
  const [suggestedLotPrice, setSuggestedLotPrice] = useState("");
  const [lotSize, setLotSize] = useState("");

  // 1. Busca a área a ser editada
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getArea(String(id));
        setArea(data);
        
        // 2. Popula os estados do formulário
        setDescription(data.description);
        setTotalArea(String(data.total_area_hectare));
        setRegistration(data.registration_number ?? "");
        setLocation(data.location ?? "");
        setSuggestedLotPrice(data.suggested_lot_price ? String(data.suggested_lot_price) : "");
        setLotSize(data.lot_size);

      } catch (e: any) {
        Alert.alert("Erro", errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 3. Garante que apenas o dono possa editar
  useEffect(() => {
    if (!loading && area && user?.id && area.owner_id !== user.id) {
      Alert.alert("Permissão", "Você não é o proprietário desta área.");
      router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: String(id) } });
    }
  }, [loading, area, user?.id, router, id]);

  const onSubmit = async () => {
    // Validação extra
    if (!id || !user?.id) {
       Alert.alert("Atenção", "Você não tem permissão ou não está logado.");
       return;
    }
    setSaving(true);
    try {
      // Cria o payload a partir dos estados
      const payload: UpdateAreaDTO = {
        description: description.trim(),
        total_area_hectare: Number(totalArea) || 0,
        lot_size: lotSize,
        registration_number: registration.trim() || undefined,
        location: location.trim() || undefined,
        suggested_lot_price: suggestedLotPrice ? Number(suggestedLotPrice) : undefined,
      };
      
      // Validação
      if (
        !payload.description ||
        !payload.lot_size ||
        !(Number(payload.total_area_hectare) > 0)
      ) {
        Alert.alert("Atenção", "Descrição, tamanho do lote e área (ha) são obrigatórios.");
        setSaving(false);
        return;
      }

      // CORREÇÃO: Passa o 'id' da área, o 'payload' e o 'user.id' (owner_id)
      const updated = await updateArea(String(id), payload, user.id);
      
      Alert.alert("Sucesso", "Área atualizada!");
      router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: updated.id } });
    } catch (e: any) {
      Alert.alert("Erro de Atualização", errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campos do Formulário */}
        <Text style={s.label}>Descrição *</Text>
        <TextInput
          style={s.input}
          placeholder="ex.: Loteamento Santa Rita"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
        />
        
        <Text style={s.label}>Área total (hectares) *</Text>
        <TextInput
          style={s.input}
          placeholder="ex.: 12.5"
          value={totalArea}
          onChangeText={setTotalArea}
          keyboardType="decimal-pad"
        />

        <Text style={s.label}>Tamanho do lote *</Text>
        <View style={s.lotSelector}>
          <LotSizeButton
            label="10x20"
            value="TENx20"
            current={lotSize}
            onPress={setLotSize}
          />
          <LotSizeButton
            label="10x30"
            value="TENx30"
            current={lotSize}
            onPress={setLotSize}
          />
          {!!lotSize && (
            <TouchableOpacity onPress={() => setLotSize("")} style={{ padding: 8 }}>
              <Text style={{ color: '#9CA3AF' }}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.label}>Matrícula (opcional)</Text>
        <TextInput
          style={s.input}
          placeholder="ex.: 12345-ABC"
          value={registration}
          onChangeText={setRegistration}
        />
        
        <Text style={s.label}>Localização (opcional)</Text>
        <TextInput
          style={s.input}
          placeholder="Endereço, cidade ou coordenadas"
          value={location}
          onChangeText={setLocation}
        />
        
        <Text style={s.label}>Valor sugerido p/ lote (R$)</Text>
        <TextInput
          style={s.input}
          placeholder="ex.: 15000"
          value={suggestedLotPrice}
          onChangeText={setSuggestedLotPrice}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity 
          onPress={onSubmit} 
          disabled={saving}
          style={[s.button, saving && s.buttonDisabled]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos
const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, gap: 12, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  lotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lotButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  lotButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  lotButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lotButtonTextSelected: {
    color: '#fff',
  },
  button: { 
    backgroundColor: "#2563eb", padding: 14, borderRadius: 10,
    marginTop: 16, alignItems: 'center'
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 },
});