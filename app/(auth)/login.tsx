import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Link, Redirect, router } from "expo-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { loginPassword, safeGetMe, loginWithGoogle } from "../../services/auth";
import { extractErrorMessage } from "../../services/normalize";
import { decodeJwt } from "../../services/jwt";

import FormTextInput from "../../components/FormTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import SooviLogo from "../../assets/images/svg/soovi-logo-azul.svg";

const TouchableOpacity = require("react-native").TouchableOpacity;
const Feather = require("react-native-vector-icons/Feather").default;

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
      // ignora e tenta de novo
    }
    const jitter = Math.floor(Math.random() * 60);
    await sleep(delay + jitter);
    elapsed += delay + jitter;
    delay = Math.min(Math.floor(delay * factor), 1400);
  }

  throw new Error("Timeout esperando consistência do /users/me.");
}

const PasswordTextInput: React.FC<{ control: any }> = ({ control }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={{ position: "relative", justifyContent: "center" }}>
      <FormTextInput
        name="password"
        control={control}
        placeholder="Senha"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPress={() => setShowPassword((s: boolean) => !s)}
        activeOpacity={0.7}
        style={{
          position: "absolute",
          right: 12,
          top: 5,
          height: 40,
          justifyContent: "center",
        }}
      >
        <Feather
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
    </View>
  );
};

export default function SignIn() {
  const { user, setSession, clearSession } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [googleLoading, setGoogleLoading] = React.useState(false);

  if (user) return <Redirect href="/(tabs)" />;

  const onSubmit = async (data: FormData) => {
    const expectedEmail = data.email.toLowerCase();

    try {
      const raw = await loginPassword({
        email: expectedEmail,
        password: data.password,
      });

      const accessToken =
        raw?.accessToken ?? raw?.access_token ?? raw?.data?.accessToken ?? null;
      const refreshToken =
        raw?.refreshToken ??
        raw?.refresh_token ??
        raw?.data?.refreshToken ??
        null;

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
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
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
              // se ainda falhar, mantém sessão só com token
            }
          })();

          Toast.show({ type: "success", text1: "Bem-vindo!" });
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          router.replace("/(tabs)");
          return;
        }

        await clearSession();
        Toast.show({
          type: "error",
          text1: "Login bloqueado",
          text2: "As credenciais não correspondem ao usuário.",
        });
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      }
    } catch (e: any) {
      await clearSession();
      Toast.show({
        type: "error",
        text1: "Não foi possível entrar",
        text2: "Email ou senha inválidos.",
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      console.log("Erro ao iniciar login com Google", e);
      Toast.show({
        type: "error",
        text1: "Não foi possível abrir o Google",
        text2:
          extractErrorMessage(e) ??
          "Tente novamente em alguns instantes.",
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              flex: 1,
              padding: 20,
              justifyContent: "center",
              backgroundColor: "#F9FAFB",
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                bottom: 30,
              }}
            >
              <SooviLogo width={200} height={60} />
              <Text
                style={{
                  fontSize: 16,
                  color: "#6B7280",
                  bottom: 15,
                  top: 1,
                }}
              >
                Bem-vindo de volta
              </Text>
            </View>

            <FormTextInput
              name="email"
              control={control}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordTextInput control={control} />

            <PrimaryButton
              title="Entrar"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />

            {/* separador */}
            <View style={{ marginVertical: 16, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
              <Text style={{ marginHorizontal: 8, color: "#9CA3AF", fontSize: 12 }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            </View>

            {/* Botão Google */}
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
            />
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text>Não tem conta? </Text>
              <Link href="/(auth)/register" asChild>
                <Text style={{ color: "#2563EB", fontWeight: "700" }}>
                  Cadastre-se
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}
