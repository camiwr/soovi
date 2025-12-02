import { Stack } from 'expo-router';

export default function SimulationLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Simulações' }}
      />
      <Stack.Screen
        name="select-area"
        options={{ title: 'Selecionar área' }}
      />
      <Stack.Screen
        name="create"
        options={{ title: 'Nova simulação' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalhes da simulação' }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: 'Editar simulação' }}
      />
    </Stack>
  );
}
