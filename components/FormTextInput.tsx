import React from "react";
import { Controller } from "react-hook-form";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { maskCurrencyInputBRL } from "@/utils/formatCurrency";

type Props = {
  name: string;
  control: any;
  label?: string;
} & Omit<TextInputProps, "onChange" | "value">;

type MaskedProps = {
  maskType?: "cpf" | "phone" | "currency";
} & Props;

// Helpers de máscara simples

function maskCPF(value: string): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9
  )}-${digits.slice(9)}`;
}

function maskPhoneBR(value: string): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    // (99) 9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // (99) 9999-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // (99) 99999-9999
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function FormTextInput({
  name,
  control,
  label,
  maskType,
  ...inputProps
}: MaskedProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        const handleChangeText = (text: string) => {
          let masked = text;

          if (maskType === "cpf") {
            masked = maskCPF(text);
          } else if (maskType === "phone") {
            masked = maskPhoneBR(text);
          } else if (maskType === "currency") {
            masked = maskCurrencyInputBRL(text);
          }

          onChange(masked);
        };

        return (
          <View style={{ marginBottom: 16 }}>
            {label ? (
              <Text
                style={{
                  marginBottom: 6,
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "600",
                }}
                accessibilityRole="text"
              >
                {label}
              </Text>
            ) : null}

            <TextInput
              onBlur={onBlur}
              onChangeText={handleChangeText}
              value={value}
              style={{
                borderWidth: 1,
                borderColor: error ? "#DC2626" : "#D1D5DB",
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: "white",
                fontSize: 16,
              }}
              placeholderTextColor="#9CA3AF"
              keyboardType={
                maskType === "currency" || maskType === "phone"
                  ? "numeric"
                  : inputProps.keyboardType
              }
              {...inputProps}
            />

            {!!error && (
              <Text
                style={{ color: "#DC2626", marginTop: 6, fontSize: 12 }}
                accessible
                accessibilityLiveRegion="polite"
              >
                {error.message}
              </Text>
            )}
          </View>
        );
      }}
    />
  );
}
