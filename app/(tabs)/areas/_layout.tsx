import { Stack } from "expo-router";

export default function AreasLayout() {
    return (
        <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="create" options={{ title: "Nova Área" }} />
            <Stack.Screen name="[id]" options={{ title: "Detalhes da Área" }} />
            <Stack.Screen name="edit/[id]" options={{ title: "Editar Área" }} />
        </Stack>
    );
}