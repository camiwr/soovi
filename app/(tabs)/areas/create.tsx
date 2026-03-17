import { useAuth } from "@/context/AuthContext";
import { createArea } from "@/services/areas";
import type { CreateAreaDTO } from "@/types/area";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { maskCurrencyInputBRL, parseCurrencyBRLToNumber } from "@/utils/formatCurrency";

function errMsg(e: any) {
  const msg = e?.response?.data?.message;
  if (msg) {
    return Array.isArray(msg) ? msg.join("\n") : String(msg);
  }
  return e?.message ?? "Falha ao criar.";
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

export default function CreateAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);

  // Estados do formulário
  const [description, setDescription] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [registration, setRegistration] = useState("");
  const [location, setLocation] = useState("");
  // Endereço detalhado
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [linkLocation, setLinkLocation] = useState("");
  const [suggestedLotPrice, setSuggestedLotPrice] = useState(""); // string mascarada
  const [lotSize, setLotSize] = useState(""); // "TENx20" | "TENx30"

  const lotSizes = [
    { label: "10x20", value: "TENx20" },
    { label: "10x30", value: "TENx30" },
  ];

  const openPicker = () => setPickerVisible(true);
  const closePicker = () => setPickerVisible(false);

  // 🔹 Handler da máscara de moeda (substitui TextInputMask)
  const handlePriceChange = (text: string) => {
    const masked = maskCurrencyInputBRL(text);
    setSuggestedLotPrice(masked);
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        Alert.alert("Atenção", "Faça login novamente para criar áreas.");
        setLoading(false);
        return;
      }

      // Validação dos campos obrigatórios
      if (
        !description.trim() ||
        !totalArea.trim() ||
        !lotSize ||
        !suggestedLotPrice.trim()
      ) {
        Alert.alert(
          "Atenção",
          "Preencha todos os campos obrigatórios: Descrição, Área total, Tamanho do lote e Valor sugerido para o lote."
        );
        setLoading(false);
        return;
      }

      // Criar o payload a partir dos estados (camelCase conforme API)
      const payload: CreateAreaDTO = {
        description: description.trim(),
        totalAreaHectare: Number(totalArea) || 0,
        lotSize: lotSize,
        registrationNumber: registration.trim() || undefined,
        // Endereço dividido
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        district: district.trim() || undefined,
        city: city.trim() || undefined,
        state: stateField.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        linkLocation: linkLocation.trim() || undefined,
        // campo legado/opcional que antes existia
        location: location.trim() || undefined,
        // 🔹 Agora usando o parser centralizado
        suggestedLotPrice: parseCurrencyBRLToNumber(suggestedLotPrice),
      } as any;

      // Validação do frontend
      if (
        !payload.description ||
        !payload.lotSize ||
        !(payload.totalAreaHectare > 0)
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
      router.replace({
        pathname: "/(tabs)/areas/[id]",
        params: { id: created.id },
      });
    } catch (e: any) {
      Alert.alert("Erro ao Criar", errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Campos do Formulário */}
        <Text style={[s.label, { marginTop: 20 }]}>Descrição *</Text>
        <TextInput
          style={[s.input, { marginBottom: 15 }]}
          placeholder="ex.: Loteamento Santa Rita"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
        />

        <Text style={[s.label, { marginTop: 15 }]}>
          Área total (hectares) *
        </Text>
        <TextInput
          style={[s.input, { marginBottom: 15 }]}
          placeholder="ex.: 12.5"
          value={totalArea}
          onChangeText={setTotalArea}
          keyboardType="decimal-pad"
        />

        <Text style={[s.label, { marginTop: 15 }]}>Tamanho do lote *</Text>
        <TouchableOpacity
          onPress={openPicker}
          style={[
            s.input,
            {
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ color: lotSize ? "#000" : "#9CA3AF" }}>
            {lotSize
              ? lotSizes.find((item) => item.value === lotSize)?.label
              : "Selecione o tamanho do lote"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {!!lotSize && (
          <TouchableOpacity
            onPress={() => setLotSize("")}
            style={{ padding: 8 }}
          >
            <Text style={{ color: "#9CA3AF" }}>Limpar</Text>
          </TouchableOpacity>
        )}

        <Modal visible={isPickerVisible} animationType="slide" transparent>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <FlatList
                data={lotSizes}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalItem}
                    onPress={() => {
                      setLotSize(item.value);
                      closePicker();
                    }}
                  >
                    <Text style={s.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={closePicker}
                style={s.modalCloseButton}
              >
                <Text style={s.modalCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={[s.label, { marginTop: 15 }]}>Matrícula (opcional)</Text>
        <TextInput
          style={[s.input, { marginBottom: 15 }]}
          placeholder="ex.: 12345-ABC"
          value={registration}
          onChangeText={setRegistration}
        />

        <Text style={[s.label, { marginTop: 15 }]}>Endereço</Text>
        <TextInput
          style={[s.input, { marginBottom: 12 }]}
          placeholder="Rua"
          value={street}
          onChangeText={setStreet}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Número"
            value={number}
            onChangeText={setNumber}
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Complemento"
            value={complement}
            onChangeText={setComplement}
          />
        </View>

        <Text style={[s.label, { marginTop: 12 }]}>Bairro</Text>
        <TextInput
          style={[s.input, { marginBottom: 12 }]}
          placeholder="Bairro"
          value={district}
          onChangeText={setDistrict}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Cidade"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Estado"
            value={stateField}
            onChangeText={setStateField}
          />
        </View>

        <Text style={[s.label, { marginTop: 12 }]}>CEP</Text>
        <TextInput
          style={[s.input, { marginBottom: 12 }]}
          placeholder="00000000"
          value={zipCode}
          // aceita apenas números, máximo 8 caracteres
          keyboardType="numeric"
          maxLength={8}
          onChangeText={(text) => setZipCode(text.replace(/\D/g, ""))}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Link de localização (opcional)</Text>
        <TextInput
          style={[s.input, { marginBottom: 15 }]}
          placeholder="Link do mapa ou coordenadas"
          value={linkLocation}
          onChangeText={setLinkLocation}
        />

        <Text style={[s.label, { marginBottom: 15 }]}>
          Valor sugerido para o lote (R$)
        </Text>
        <TextInput
          value={suggestedLotPrice}
          onChangeText={handlePriceChange}
          keyboardType="numeric"
          placeholder="Preço sugerido do lote"
          style={[s.input, { marginBottom: 15 }]}
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
      </KeyboardAwareScrollView>
    </SafeAreaProvider>
  );
}

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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lotButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  lotButtonSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  lotButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  lotButtonTextSelected: {
    color: "#fff",
  },
  button: {
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalItemText: {
    fontSize: 16,
    color: "#374151",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
