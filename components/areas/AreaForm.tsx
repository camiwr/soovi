import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity, // 1. Importe TouchableOpacity
} from "react-native";
// O InputSpinner não é mais necessário para este campo
// import InputSpinner from "react-native-input-spinner";

type FormValues = {
  description: string;
  total_area_hectare: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price?: number;
  lot_size: string;
};

type Props = {
  initial?: Partial<FormValues>;
  onChange: (values: FormValues) => void;
};

// Componente de botão para o seletor
const LotSizeButton: React.FC<{
  label: string;
  value: string;
  current: string;
  onPress: (value: string) => void;
}> = ({ label, value, current, onPress }) => {
  const isSelected = value === current;
  return (
    <TouchableOpacity
      style={[
        s.lotButton,
        isSelected && s.lotButtonSelected,
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          s.lotButtonText,
          isSelected && s.lotButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};


export default function AreaForm({ initial, onChange }: Props) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [totalArea, setTotalArea] = useState(
    initial?.total_area_hectare != null ? String(initial.total_area_hectare) : ""
  );
  const [registration, setRegistration] = useState(
    initial?.registration_number ?? ""
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [suggestedLotPrice, setSuggestedLotPrice] = useState(
    initial?.suggested_lot_price != null
      ? String(initial.suggested_lot_price)
      : ""
  );
  
  // 2. O estado 'lotSize' agora será "TENx30", "TENx20" ou ""
  const [lotSize, setLotSize] = useState(
    initial?.lot_size ?? ""
  );

  useEffect(() => {
    onChange({
      description: description.trim(),
      total_area_hectare: Number(totalArea) || 0,
      registration_number: registration.trim() || undefined,
      location: location.trim() || undefined,
      suggested_lot_price: suggestedLotPrice ? Number(suggestedLotPrice) : undefined,
      lot_size: lotSize.trim(), // Envia a string "TENx30" ou "TENx20"
    });
  }, [description, totalArea, registration, location, suggestedLotPrice, lotSize, onChange]);

  return (
    <View style={s.form}>
      <Text style={s.label}>Matrícula (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 12345-ABC"
        value={registration}
        onChangeText={setRegistration}
        autoCapitalize="characters"
      />
      <Text style={s.label}>Descrição*</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: Loteamento Santa Rita"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
      />
      <Text style={s.label}>Localização (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="endereço / coordenadas"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={s.label}>Área total (hectares) *</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 12.5"
        value={totalArea}
        onChangeText={setTotalArea}
        keyboardType="decimal-pad"
      />

      {/* 3. CORREÇÃO: Substituído TextInput por um seletor de botões */}
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
        {/* Botão para limpar a seleção, se necessário */}
        {!!lotSize && (
           <TouchableOpacity onPress={() => setLotSize("")} style={{ padding: 8 }}>
             <Text style={{ color: '#9CA3AF' }}>Limpar</Text>
           </TouchableOpacity>
        )}
      </View>
      
      <Text style={s.label}>Valor sugerido para o lote (R$)</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 15000"
        value={suggestedLotPrice}
        onChangeText={setSuggestedLotPrice}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const s = StyleSheet.create({
  form: { gap: 12 },
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
  // 4. Estilos para os novos botões
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
});