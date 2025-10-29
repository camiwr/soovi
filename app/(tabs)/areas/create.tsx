import React, { useRef } from "react";
import { Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AreaForm from "@/components/areas/AreaForm";
import { createArea } from "@/services/areas";
import { useAuth } from "../../../context/AuthContext";

export default function CreateAreaScreen() {
  const router = useRouter();
  const { user } = useAuth(); 
  const draftRef = useRef<any>({});

  const onChange = (data: any) => { draftRef.current = data; };

  const onSubmit = async () => {
    if (!user?.id) {
      Alert.alert("Atenção", "Faça login novamente para criar áreas.");
      return;
    }
    const d = draftRef.current;
    if (!d?.description || !d?.total_area_hectare) {
      Alert.alert("Atenção", "Preencha descrição e área total (ha).");
      return;
    }
    try {
      const created = await createArea({ ...d, owner_id: user.id });
      Alert.alert("Sucesso", "Área criada com sucesso!");
      router.replace({ pathname: "/(tabs)/areas/[id]", params: { id: created.id } });
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível criar.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <AreaForm onChange={onChange} />
      {(() => {
        const SubmitButton: React.FC = () => {
          const [loading, setLoading] = React.useState(false);

          const handlePress = async () => {
            setLoading(true);
            try {
              await onSubmit();
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
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
                {loading ? "Salvando..." : "Salvar"}
              </Text>
            </TouchableOpacity>
          );
        };

        return <SubmitButton />;
      })()}
    </ScrollView>
  );
}
