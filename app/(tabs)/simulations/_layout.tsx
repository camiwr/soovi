import { Stack } from "expo-router";
export default function SimulationsLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
      <Stack.Screen name="index" options={{ title: "Simulações" }} />
      <Stack.Screen name="select-area" options={{ title: "Escolher Área" }} />
      <Stack.Screen name="create" options={{ title: "Nova Simulação" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalhes da Simulação" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar Simulação" }} />
    </Stack>
  );
}
