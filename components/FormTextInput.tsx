import React from "react";
import { Controller } from "react-hook-form";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { TextInputMask, TextInputMaskProps } from "react-native-masked-text";

type Props = {
  name: string;
  control: any;
  label?: string;
} & Omit<TextInputProps, "onChange" | "value">;

type MaskedProps = {
  maskType?: "cpf" | "phone" | "currency";
} & Props;

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
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ marginBottom: 16 }}>
          {label ? (
            <Text
              style={{ marginBottom: 6, fontSize: 14, color: "#111827", fontWeight: "600" }}
              accessibilityRole="text"
            >
              {label}
            </Text>
          ) : null}

          {maskType ? (
            (() => {
              const { type: _type, ...maskInputProps } = inputProps as TextInputMaskProps;
              return (
                <TextInputMask
                  type={
                    maskType === "cpf"
                      ? "cpf"
                      : maskType === "phone"
                      ? "cel-phone"
                      : "money"
                  }
                  options={
                    maskType === "phone"
                      ? { maskType: "BRL", withDDD: true, dddMask: "(99) " }
                      : maskType === "currency"
                      ? { precision: 2, separator: ",", delimiter: ".", unit: "R$ ", suffixUnit: "" }
                      : undefined
                  }
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
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
                  {...maskInputProps}
                />
              );
            })()
          ) : (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
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
              {...inputProps}
            />
          )}

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
      )}
    />
  );
}
