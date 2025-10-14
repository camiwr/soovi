import React from 'react';
import { Tabs } from 'expo-router';
import { CalculatorIcon, HomeIcon, MapIcon, UserIcon } from 'lucide-react-native';



export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
      }}
      />
      <Tabs.Screen
      name="simulations"
      options={{
        title: 'Simulações',
        tabBarIcon: ({ color, size }) => <CalculatorIcon color={color} size={size} />,
      }}
      />
      <Tabs.Screen
      name="areas"
      options={{
        title: 'Áreas',
        tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
      }}
      />
      <Tabs.Screen
      name="profile"
      options={{
        title: 'Perfil',
        tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
      }}
      />
    </Tabs>
  );
}
