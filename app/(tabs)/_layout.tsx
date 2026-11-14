import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0f766e",
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "700", color: "#0f172a" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Entradas",
          tabBarAccessibilityLabel: "Pestaña de entradas",
        }}
      />
      <Tabs.Screen
        name="etiquetas"
        options={{
          title: "Etiquetas",
          tabBarAccessibilityLabel: "Pestaña de etiquetas",
        }}
      />
    </Tabs>
  );
}
