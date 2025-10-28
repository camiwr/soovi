import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Link, Redirect, router } from "expo-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { loginPassword, safeGetMe } from "../../services/auth";
import { extractErrorMessage } from "../../services/normalize";
import { decodeJwt } from "../../services/jwt";

import FormTextInput from "../../components/FormTextInput";
import PrimaryButton from "../../components/PrimaryButton";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

// helpers
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForConsistentMeStrict({
  accessToken,
  expectedEmail,
  maxDurationMs = 15000,  
  baseDelayMs = 200,
  factor = 1.9,
  warmupMs = 250,         
}: {
  accessToken: string;
  expectedEmail: string;
  maxDurationMs?: number;
  baseDelayMs?: number;
  factor?: number;
  warmupMs?: number;
}) {
  let elapsed = 0;
  let delay = baseDelayMs;

  if (warmupMs > 0) {
    await sleep(warmupMs);
    elapsed += warmupMs;
  }

  while (elapsed <= maxDurationMs) {
    try {
      const me = await safeGetMe(accessToken);
      const meEmail = String(me?.email || "").toLowerCase();
      if (meEmail === expectedEmail) return me;
    } catch {
    }
    const jitter = Math.floor(Math.random() * 60);
    await sleep(delay + jitter);
    elapsed += delay + jitter;
    delay = Math.min(Math.floor(delay * factor), 1400); 
  }

  throw new Error("Timeout esperando consistência do /users/me.");
}

export default function SignIn() {
  const { user, setSession, clearSession } = useAuth();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (user) return <Redirect href="/(tabs)" />;

  const onSubmit = async (data: FormData) => {
    const expectedEmail = data.email.toLowerCase();

    try {
      const raw = await loginPassword({ email: data.email, password: data.password });
      const accessToken =
        raw?.accessToken ?? raw?.access_token ?? raw?.data?.accessToken ?? null;
      const refreshToken =
        raw?.refreshToken ?? raw?.refresh_token ?? raw?.data?.refreshToken ?? null;

      if (!accessToken) throw new Error("Token ausente na resposta de login.");

      try {
        const me = await waitForConsistentMeStrict({
          accessToken,
          expectedEmail,
          maxDurationMs: 15000,
          baseDelayMs: 220,
          factor: 1.9,
          warmupMs: 300,
        });

        await setSession({ user: me, accessToken, refreshToken });
        Toast.show({ type: "success", text1: "Bem-vindo!" });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
        return;
      } catch {
        const claims = decodeJwt(accessToken);
        const tokenEmail = String(claims?.email ?? claims?.sub ?? "").toLowerCase();

        if (tokenEmail && tokenEmail === expectedEmail) {
          await setSession({ user: null, accessToken, refreshToken });

          (async () => {
            try {
              const meLater = await waitForConsistentMeStrict({
                accessToken,
                expectedEmail,
                maxDurationMs: 20000,
                baseDelayMs: 300,
                factor: 1.8,
                warmupMs: 0,
              });
              await setSession({ user: meLater, accessToken, refreshToken });
            } catch {

            }
          })();

          Toast.show({ type: "success", text1: "Bem-vindo!" });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
          return;
        }

        await clearSession();
        Toast.show({
          type: "error",
          text1: "Login bloqueado",
          text2: "As credenciais não correspondem ao usuário.",
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      await clearSession();
      Toast.show({
        type: "error",
        text1: "Não foi possível entrar",
        text2: extractErrorMessage(e) || "Tente novamente em instantes.",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#F9FAFB" }}>
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 }}>soovi</Text>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Bem-vindo de volta</Text>
            </View>

            <FormTextInput name="email" control={control} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <FormTextInput name="password" control={control} placeholder="Senha" secureTextEntry />

            <PrimaryButton title="Entrar" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
              <Text>Não tem conta? </Text>
              <Link href="/(auth)/register" asChild>
                <Text style={{ color: "#2563EB", fontWeight: "700" }}>Cadastre-se</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider >
  );
}
