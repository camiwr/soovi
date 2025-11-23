import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Link, Redirect, router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";

import { useAuth } from "../../context/AuthContext";
import { createUser, loginPassword, safeGetMe } from "../../services/auth";
import { decodeJwt } from "../../services/jwt";
import { extractErrorMessage } from "../../services/normalize";
import { isValidCPF, isValidPhoneBR, onlyDigits } from "../../utils/validators";

import { SafeAreaProvider } from "react-native-safe-area-context";
import FormTextInput from "../../components/FormTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { Eye, EyeOff } from "lucide-react-native";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForConsistentMeStrict({
  accessToken,
  expectedEmail,
  maxDurationMs = 15000,
  baseDelayMs = 200,
  factor = 1.9,
  warmupMs = 300,
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
    } catch { }
    const jitter = Math.floor(Math.random() * 60);
    await sleep(delay + jitter);
    elapsed += delay + jitter;
    delay = Math.min(Math.floor(delay * factor), 1400);
  }

  throw new Error("Timeout esperando consistência do /users/me.");
}

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("E-mail inválido"),

    cpf: z
      .string()
      .optional()
      .transform((v) => (v ? onlyDigits(v) : undefined))
      .refine((v) => !v || isValidCPF(v), "CPF inválido"),

    phone: z
      .string()
      .optional()
      .transform((v) => (v ? onlyDigits(v) : undefined))
      .refine((v) => !v || isValidPhoneBR(v), "Telefone inválido (use DDD; cel: 11 dígitos)"),

    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Se senha for informada, exige mínimo e confirmação
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mínimo de 6 caracteres",
        path: ["password"],
      });
    }
    if ((data.password || data.confirmPassword) && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem",
        path: ["confirmPassword"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

const PasswordTextInput: React.FC<{ control: any; name: string; placeholder: string }> = ({ control, name, placeholder }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <FormTextInput
        name={name}
        control={control}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPress={() => setShowPassword((s: boolean) => !s)}
        activeOpacity={0.7}
        style={{ position: 'absolute', right: 12, top: 5, height: 40, justifyContent: 'center' }}
      >
        {showPassword ? <Eye size={20} color="#6B7280" /> : <EyeOff size={20} color="#6B7280" />}
      </TouchableOpacity>
    </View>
  );
};

export default function SignUp() {
  const { user, setSession, clearSession } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (user) return <Redirect href="/(tabs)" />;

  const onSubmit = async (data: FormData) => {
    const expectedEmail = data.email.trim().toLowerCase();

    try {
      const payload = {
        name: data.name.trim(),
        email: expectedEmail,
        cpf: data.cpf ? onlyDigits(data.cpf) : undefined,
        phone: data.phone ? onlyDigits(data.phone) : undefined,
        password: data.password ? data.password : undefined, // opcional
      };
      await createUser(payload);

      if (!data.password) {
        Toast.show({ type: "success", text1: "Conta criada!", text2: "Entre com seu e-mail na próxima tela." });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(auth)/login");
        return;
      }

      const auth = await loginPassword({ email: expectedEmail, password: data.password });

      const accessToken =
        auth?.accessToken ?? auth?.access_token ?? auth?.data?.accessToken ?? null;
      const refreshToken =
        auth?.refreshToken ?? auth?.refresh_token ?? auth?.data?.refreshToken ?? null;

      if (!accessToken) throw new Error("Token ausente após login.");

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
        Toast.show({ type: "success", text1: "Conta criada!" });
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
            } catch { }
          })();

          Toast.show({ type: "success", text1: "Conta criada!" });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
          return;
        }

        await clearSession();
        Toast.show({ type: "error", text1: "Cadastro inconsistente", text2: "As credenciais não correspondem." });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      await clearSession();
      Toast.show({ type: "error", text1: "Falha no cadastro", text2: extractErrorMessage(e) });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 }}>soovi</Text>
            <Text style={{ fontSize: 16, color: '#6B7280' }}>Crie sua conta</Text>
        </View>

        <FormTextInput name="name" control={control} placeholder="Nome completo" />
        <FormTextInput
          name="email"
          control={control}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FormTextInput
          name="cpf"
          control={control}
          placeholder="CPF"
          maskType="cpf"
          keyboardType="number-pad"
        />
        <FormTextInput
          name="phone"
          control={control}
          placeholder="Telefone com DDD"
          maskType="phone"
          keyboardType="phone-pad"
        />
        <PasswordTextInput control={control} name="password" placeholder="Senha" />
        <PasswordTextInput control={control} name="confirmPassword" placeholder="Confirmar senha" />

        <PrimaryButton title="Cadastrar" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
          <Text>Já tem conta? </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={{ color: "#2563EB", fontWeight: "700" }}>Entrar</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaProvider >
  );
}