import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, Redirect, router } from "expo-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { loginPassword, safeGetMe, loginWithGoogle } from "../../services/auth";
import { extractErrorMessage } from "../../services/normalize";

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

GoogleSignin.configure({
  iosClientId:
    "998161092266-gg85ijqmb2apd1eddg29ulju6ere7hsl.apps.googleusercontent.com",
});

type SessionPayload = {
  user: any | null;
  accessToken: string;
  refreshToken: string | null; // nunca undefined
};

function normalizeAuthTokens(raw: any): { accessToken: string | null; refreshToken: string | null } {
  const accessToken =
    raw?.accessToken ??
    raw?.access_token ??
    raw?.data?.accessToken ??
    raw?.data?.access_token ??
    null;

  const refreshToken =
    raw?.refreshToken ??
    raw?.refresh_token ??
    raw?.data?.refreshToken ??
    raw?.data?.refresh_token ??
    null;

  return {
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
  };
}

async function getGoogleProfile(): Promise<{ email: string; name: string }> {
  console.log("[Google] hasPlayServices...");
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  console.log("[Google] signIn...");
  const info: any = await GoogleSignin.signIn();
  console.log("[Google] signIn result:", info);

  const user = info?.user ?? info?.data?.user ?? info?.data ?? info;

  const email = String(user?.email ?? "").toLowerCase();
  const name =
    user?.name ??
    user?.givenName ??
    user?.displayName ??
    (email ? email.split("@")[0] : "");

  console.log("[Google] parsed:", { email, name });

  if (!email) throw new Error("Google não retornou e-mail.");
  return { email, name };
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
        <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
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

  console.log("[SignIn] Render", { hasUser: !!user });

  if (user) {
    console.log("[SignIn] Usuário já logado, redirecionando para /(tabs)");
    return <Redirect href="/(tabs)" />;
  }

  //  LOGIN NORMAL (email/senha) 

  const onSubmit = async (data: FormData) => {
    const expectedEmail = data.email.toLowerCase();
    console.log("[SignIn] onSubmit chamado", { expectedEmail });

    try {
      console.log("[SignIn] Chamando loginPassword...");
      const raw = await loginPassword({
        email: expectedEmail,
        password: data.password,
      });
      console.log("[SignIn] loginPassword RAW:", raw);

      const { accessToken, refreshToken } = normalizeAuthTokens(raw);
      console.log("[SignIn] Tokens normalizados", { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

      if (!accessToken) throw new Error("Token ausente na resposta de login.");

      console.log("[SignIn] Chamando /users/me com accessToken...");
      const me = await safeGetMe(accessToken);
      console.log("[SignIn] /users/me:", me);

      const payload: SessionPayload = {
        user: me ?? null,
        accessToken,
        refreshToken: refreshToken ?? null,
      };

      await setSession(payload);
      Toast.show({ type: "success", text1: "Bem-vindo!" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      console.log("[SignIn] ERRO login senha:", e);
      console.log("[SignIn] ERRO response:", e?.response?.data);

      await clearSession();
      Toast.show({
        type: "error",
        text1: "Não foi possível entrar",
        text2: e?.response?.data?.message ?? e?.message ?? "Email ou senha inválidos.",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };


  //  LOGIN GOOGLE — básico:

  const handleGoogleSignIn = async () => {
    console.log("[SignIn][Google] start");

    try {
      setGoogleLoading(true);

      const { email, name } = await getGoogleProfile();
      console.log("[SignIn][Google] profile:", { email, name });

      console.log("[SignIn][Google] POST /auth/google...");
      const raw = await loginWithGoogle({ email, name }); // sua rota é /auth/google no service
      console.log("[SignIn][Google] backend RAW:", raw);

      const { accessToken, refreshToken } = normalizeAuthTokens(raw);
      console.log("[SignIn][Google] Tokens normalizados", { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

      if (!accessToken) throw new Error("Token ausente no login com Google.");

      console.log("[SignIn][Google] Chamando /users/me com accessToken...");
      const me = await safeGetMe(accessToken);
      console.log("[SignIn][Google] /users/me:", me);

      const payload: SessionPayload = {
        user: me ?? null,
        accessToken,
        refreshToken: refreshToken ?? null,
      };

      await setSession(payload);
      Toast.show({ type: "success", text1: "Bem-vindo com Google!" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      console.log("[SignIn][Google] ERROR:", e);
      console.log("[SignIn][Google] ERROR response:", e?.response?.data);

      await clearSession();
      Toast.show({
        type: "error",
        text1: "Falha no login com Google",
        text2: extractErrorMessage(e) ?? e?.response?.data?.message ?? e?.message ?? "Erro desconhecido",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGoogleLoading(false);
      console.log("[SignIn][Google] end");
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
              <Text style={{ marginHorizontal: 8, color: "#9CA3AF", fontSize: 12 }}>
                ou
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            </View>

            {/* Botão Google */}
            <GoogleSignInButton onPress={handleGoogleSignIn} loading={googleLoading} />

            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
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
