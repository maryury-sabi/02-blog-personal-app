import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="entrada/nueva" options={{ title: "Nueva entrada" }} />
          <Stack.Screen name="entrada/[id]" options={{ title: "Entrada" }} />
          <Stack.Screen name="login" options={{ title: "Cuenta y sincronización" }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
