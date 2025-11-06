// app/(tabs)/areas/create.tsx
import React, { useRef } from "react";
import {
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AreaForm from "@/components/areas/AreaForm";
import { createArea } from "@/services/areas";
import { useAuth } from "../../../context/AuthContext";

// (Componente SubmitButton que movemos anteriormente fica aqui - sem alterações)
const SubmitButton: React.FC<{
  onPress: () => Promise<void>;
}> = ({ onPress }) => {
  const [loading, setLoading] = React.useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      style={{
        backgroundColor: "#16a34a",
        padding: 14,
        borderRadius: 10,
        opacity: loading ? 0.6 : 1,
        marginTop: 16,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
        {loading ? "Salvando..." : "Salvar"}
      </Text>
    </TouchableOpacity>
  );
};

export default function CreateAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const draftRef = useRef<any>({});

  const onChange = (data: any) => {
    draftRef.current = data;
  };

  const onSubmit = async () => {
    // --- INÍCIO DO DEBUG ---
    console.log("=============================");
    console.log("[DEBUG] Iniciando onSubmit para criar área...");
    
    const d = draftRef.current;
    console.log("[DEBUG] Dados do formulário (draftRef):", JSON.stringify(d, null, 2));
    
    if (!user?.id) {
      console.log("[DEBUG] ERRO: Usuário não autenticado.");
      console.log("=============================");
      Alert.alert("Atenção", "Faça login novamente para criar áreas.");
      return;
    }

    // Recriando o payload final que será enviado
    const payloadFinal = { ...d, owner_id: user.id };
    
    // Validação do frontend
    if (
      !payloadFinal?.description ||
      !payloadFinal?.lot_size ||
      !(Number(payloadFinal?.total_area_hectare) > 0)
    ) {
      console.log("[DEBUG] ERRO: Falha na validação do frontend.");
      console.log("Campos incompletos:", {
        description: payloadFinal?.description,
        lot_size: payloadFinal?.lot_size,
        total_area_hectare: payloadFinal?.total_area_hectare,
      });
      console.log("=============================");
      Alert.alert(
        "Atenção",
        "Preencha descrição, tamanho do lote e uma área total (ha) válida."
      );
      return;
    }
    
    try {
      console.log("[DEBUG] Enviando para API (/area) o payload:", JSON.stringify(payloadFinal, null, 2));

      // Enviando o payload com owner_id
      const created = await createArea(payloadFinal);
      
      console.log("[DEBUG] SUCESSO! Resposta da API:", JSON.stringify(created, null, 2));
      console.log("=============================");
      
      Alert.alert("Sucesso", "Área criada com sucesso!");
      router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: created.id } });
    
    } catch (e: any) {
      // --- DEBUG DETALHADO DO ERRO ---
      console.log("[DEBUG] ERRO 400 (ou outro) NA API");
      if (e.response) {
        // Erro vindo do Axios (com resposta do servidor)
        console.log("Status:", e.response.status);
        console.log("Data (Erro do Backend):", JSON.stringify(e.response.data, null, 2));
      } else {
        // Erro genérico (rede, etc)
        console.log("Erro (sem resposta da API):", e.message);
      }
      console.log("=============================");
      
      let detailedMessage = e.message ?? "Não foi possível criar.";
      if (e.response?.data?.message) {
         if (Array.isArray(e.response.data.message)) {
           detailedMessage = e.response.data.message.join('\n'); // Muito comum em erros de validação (NestJS/Zod)
         } else if (typeof e.response.data.message === 'object') {
           detailedMessage = JSON.stringify(e.response.data.message);
         } else {
           detailedMessage = e.response.data.message;
         }
      } else if (e.response?.data) {
        detailedMessage = JSON.stringify(e.response.data);
      }
      
      Alert.alert("Erro ao Criar (400)", detailedMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <AreaForm onChange={onChange} />
        <SubmitButton onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}