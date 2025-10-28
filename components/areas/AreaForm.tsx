import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

type FormValues = {
  description: string;
  total_area_hectare: number;
  registration_number?: string;
  location?: string;
//   suggested_lot_price_m2?: number;
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
//   const [priceM2, setPriceM2] = useState(
//     initial?.suggested_lot_price_m2 != null ? String(initial.suggested_lot_price_m2) : ""
//   );
  const [lotSize, setLotSize] = useState(
    initial?.lot_size != null ? String(initial.lot_size) : ""
  );

  useEffect(() => {
    onChange({
      description: description.trim(),
      total_area_hectare: Number(totalArea) || 0,
      registration_number: registration.trim() || undefined,
      location: location.trim() || undefined,
    //   suggested_lot_price_m2: priceM2 ? Number(priceM2) : undefined,
      lot_size: lotSize ? Number(lotSize) : undefined,
    });
  }, [description, totalArea, registration, location, lotSize, onChange]);

  return (
    <View style={s.form}>
      <Text style={s.label}>Descrição *</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: Loteamento Santa Rita"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
      />

      <Text style={s.label}>Área total (hectare) *</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 12.5"
        value={totalArea}
        onChangeText={setTotalArea}
        keyboardType="decimal-pad"
      />

      <Text style={s.label}>Matrícula (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 12345-ABC"
        value={registration}
        onChangeText={setRegistration}
        autoCapitalize="characters"
      />

      <Text style={s.label}>Localização (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="endereço / coordenadas"
        value={location}
        onChangeText={setLocation}
      />

      {/* <Text style={s.label}>Valor sugerido m² (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 150"
        value={priceM2}
        onChangeText={setPriceM2}
        keyboardType="decimal-pad"
      /> */}

      <Text style={s.label}>Tamanho do lote (m²) (opcional)</Text>
      <TextInput
        style={s.input}
        placeholder="ex.: 200"
        value={lotSize}
        onChangeText={setLotSize}
        keyboardType="numeric"
      />
    </View>
  );
}

const s = StyleSheet.create({
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff", fontSize: 16,
  },
});
