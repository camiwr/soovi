import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import InputSpinner from "react-native-input-spinner";

type FormValues = {
  description: string;
  total_area_hectare: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price_m2?: number;
  lot_size?: number;
};

type Props = {
  initial?: Partial<FormValues>;
  onChange: (values: FormValues) => void;
};

export default function AreaForm({ initial, onChange }: Props) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [totalArea, setTotalArea] = useState(
    initial?.total_area_hectare != null ? String(initial.total_area_hectare) : ""
  );
  const [registration, setRegistration] = useState(initial?.registration_number ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [priceM2, setPriceM2] = useState(
    initial?.suggested_lot_price_m2 != null ? String(initial.suggested_lot_price_m2) : ""
  );
  const [lotSize, setLotSize] = useState(
    initial?.lot_size != null ? String(initial.lot_size) : ""
  );

  useEffect(() => {
    onChange({
      description: description.trim(),
      total_area_hectare: Number(totalArea) || 0,
      registration_number: registration.trim() || undefined,
      location: location.trim() || undefined,
      suggested_lot_price_m2: priceM2 ? Number(priceM2) : undefined,
      lot_size: lotSize ? Number(lotSize) : undefined,
    });
  }, [description, totalArea, registration, location, lotSize, onChange]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentInset={{ bottom: 150 }}>
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

          <Text style={s.label}>Tamanho do lote</Text>
          <InputSpinner
            value={Number(lotSize || 0)}
            onChange={(num) => setLotSize(String(num))}
            min={0}
            step={1}
            skin="clean"
            height={44}
          />

          <Text style={s.label}>Valor sugerido para o lote</Text>
          <TextInput
            style={s.input}
            placeholder="ex.: 12.5"
            value={priceM2}
            onChangeText={setPriceM2}
            keyboardType="decimal-pad"
          />



        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 34, flexGrow: 5, paddingHorizontal: 24 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff", fontSize: 16,
  },
});
