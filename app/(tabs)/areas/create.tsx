import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  View,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { createArea } from "@/services/areas";
import { useAuth } from "@/context/AuthContext";
import type { CreateAreaDTO } from "@/types/area";

// Helper para tratar mensagens de erro
function errMsg(e: any) {
  const msg = e?.response?.data?.message;
  if (msg) {
    return Array.isArray(msg) ? msg.join('\n') : String(msg);
  }
  return e?.message ?? "Falha ao criar.";
}

// Helper: Componente de botão para o seletor (definido localmente)
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

export default function CreateAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados do formulário (antes em AreaForm)
  const [description, setDescription] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [registration, setRegistration] = useState("");
  const [location, setLocation] = useState("");
  const [suggestedLotPrice, setSuggestedLotPrice] = useState("");
  const [lotSize, setLotSize] = useState(""); // "TENx20" | "TENx30"

  const onSubmit = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        Alert.alert("Atenção", "Faça login novamente para criar áreas.");
        setLoading(false);
        return;
      }
      
      // Criar o payload a partir dos estados
      const payload: CreateAreaDTO = {
        description: description.trim(),
        total_area_hectare: Number(totalArea) || 0,
        lot_size: lotSize,
        registration_number: registration.trim() || undefined,
        location: location.trim() || undefined,
        suggested_lot_price: suggestedLotPrice ? Number(suggestedLotPrice) : undefined,
      };

      // Validação do frontend
      if (
        !payload.description ||
        !payload.lot_size ||
        !(payload.total_area_hectare > 0)
      ) {
        Alert.alert(
          "Atenção",
          "Preencha descrição, tamanho do lote e uma área total (ha) válida."
        );
        setLoading(false);
        return;
      }
      
      // Enviando o payload E o 'owner_id'
      const created = await createArea(payload, user.id);
      
      Alert.alert("Sucesso", "Área criada com sucesso!");
      router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: created.id } });
    
    } catch (e: any) {
      Alert.alert("Erro ao Criar", errMsg(e));
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Botão de Salvar */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={[s.button, { backgroundColor: "#16a34a" }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Salvar Área</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos
const s = StyleSheet.create({
  container: { flex: 1 },
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
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { 
    color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 16 
  },
});