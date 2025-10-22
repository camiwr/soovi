import React from "react";
import { Controller } from "react-hook-form";
import { TextInput, View, Text, TextInputProps } from "react-native";

type Props = {
  name: string;
  control: any;
  label?: string;
} & Omit<TextInputProps, "onChange" | "value">;

export default function FormTextInput({
  name,
  control,
  label,
  ...inputProps
}: Props) {
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
