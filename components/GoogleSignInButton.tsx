import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import GoogleLogo from "@/assets/images/svg/google-logo.svg";

type Props = {
  onPress: () => void;
  loading?: boolean;
};

const GoogleSignInButton: React.FC<Props> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      style={{
        marginTop: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#DADCE0",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        // sombra leve
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <GoogleLogo width={18} height={18} />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#5F6368" />
        ) : (
          <Text
            style={{
              fontSize: 14,
              color: "#3C4043",
              fontWeight: "500",
            }}
          >
            Entrar com Google
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default GoogleSignInButton;
