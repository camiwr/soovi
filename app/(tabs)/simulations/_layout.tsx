import { Stack } from "expo-router";
export default function SimulationsLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
      <Stack.Screen name="index" options={{ title: "Simulações", headerShown: false }} />
      <Stack.Screen name="select-area" options={{ title: "Escolher Área", headerShown: false }} />
      <Stack.Screen name="create" options={{ title: "Nova Simulação", headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Detalhes da Simulação", headerShown: false }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar Simulação", headerShown: false }} />
    </Stack>
  );
}
