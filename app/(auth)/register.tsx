import React from "react";
import { KeyboardAvoidingView, ScrollView, View, Text, Platform } from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { createUser, loginPassword, safeGetMe } from "../../services/auth";
import { extractErrorMessage } from "../../services/normalize";
import { decodeJwt } from "../../services/jwt";
import { onlyDigits, isValidCPF, isValidPhoneBR } from "../../utils/validators";

import FormTextInput from "../../components/FormTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { Controller } from "react-hook-form";
import { MaskedTextInput } from "react-native-mask-text";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
        <Controller
          control={control}
          name="cpf"
          render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
            <View style={{ marginBottom: 12 }}>
              <MaskedTextInput
                type="custom"
                options={{ mask: "999.999.999-99" }}
                value={value ?? ""}
                onChangeText={(masked, unmasked) => onChange(unmasked)} // salva só dígitos
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="CPF"
                style={{
                  borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
                  paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FFF", fontSize: 16,
                }}
              />
              {!!error && <Text style={{ color: "#EF4444", marginTop: 6 }}>{error.message}</Text>}
            </View>
          )}
        />

        {/* Telefone (mascarado) */}
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
            const v = (value ?? "") as string;
            const isCell = v.length >= 11;
            const mask = isCell ? "(99) 99999-9999" : "(99) 9999-9999";
            return (
              <View style={{ marginBottom: 12 }}>
                <MaskedTextInput
                  type="custom"
                  options={{ mask }}
                  value={v}
                  onChangeText={(masked, unmasked) => onChange(unmasked)} // salva só dígitos
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="Telefone com DDD"
                  style={{
                    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
                    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FFF", fontSize: 16,
                  }}
                />
                {!!error && <Text style={{ color: "#EF4444", marginTop: 6 }}>{error.message}</Text>}
              </View>
            );
          }}
        />
        <FormTextInput name="password" control={control} placeholder="Senha" secureTextEntry />
        <FormTextInput name="confirmPassword" control={control} placeholder="Confirmar senha" secureTextEntry />

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