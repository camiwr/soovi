import React from "react";
import { ActivityIndicator, Pressable, Text, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  style,
  disabled = false,
}: Props) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={[
        {
          backgroundColor: "#2563EB",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.7 : 1,
          elevation: 2,
        },
        style,
      ]}
      android_ripple={{ color: "#1E3A8A" }}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{title}</Text>
      )}
    </Pressable>
  );
}
