import React from "react";
import { Tabs, Redirect } from "expo-router";
import { CalculatorIcon, HomeIcon, MapIcon, UserIcon } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      key={user.id}
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: { backgroundColor: "#FFF", borderTopColor: "#E5E7EB" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          headerShadowVisible: false,
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="simulations"
        options={{
          title: "Simulações",
          tabBarIcon: ({ color, size }) => <CalculatorIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="areas"
        options={{
          title: "Áreas",
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
