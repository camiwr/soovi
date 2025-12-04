// app/auth/callback.tsx
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { safeGetMe } from "@/services/auth";

export default function AuthCallbackScreen() {
  const { access_token, refresh_token } = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
  }>();

  const { setSession, clearSession } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const accessToken = typeof access_token === "string" ? access_token : null;
        const refreshToken =
          typeof refresh_token === "string" ? refresh_token : null;

        if (!accessToken) {
          throw new Error("Token de acesso ausente na URL de callback.");
        }

        // tenta carregar o usuário logado com esse token
        let me: any = null;
        try {
          me = await safeGetMe(accessToken);
        } catch {
          // se der erro aqui, vamos logar só com o token mesmo
        }

        await setSession({
          user: me ?? null,
          accessToken,
          refreshToken,
        });

        Toast.show({
          type: "success",
          text1: "Login com Google realizado!",
        });
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        router.replace("/(tabs)");
      } catch (e: any) {
        console.log("Erro no callback de auth:", e);
        await clearSession();
        Toast.show({
          type: "error",
          text1: "Não foi possível finalizar o login",
          text2: "Tente novamente em alguns instantes.",
        });
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
        router.replace("./(auth)");
      }
    })();
  }, [access_token, refresh_token]);

  // telinha de loading enquanto trata o callback
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
      }}
    >
      <ActivityIndicator />
    </View>
  );
}
