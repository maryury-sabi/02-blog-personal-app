import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { usuario, iniciarSesion, registrar, cerrarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarAccion(modo: "login" | "registro") {
    setError(null);
    setCargando(true);
    try {
      if (modo === "login") await iniciarSesion(email.trim(), password);
      else await registrar(email.trim(), password);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setCargando(false);
    }
  }

  if (usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sesión iniciada</Text>
        <Text style={styles.subtitle}>{usuario.email}</Text>
        <Pressable
          onPress={async () => {
            await cerrarSesion();
            router.back();
          }}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sincronizar diario</Text>
      <Text style={styles.subtitle}>
        La app funciona sin conexión; inicia sesión para respaldar.
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        accessibilityLabel="Correo electrónico"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña (mín. 8 caracteres)"
        secureTextEntry
        style={styles.input}
        accessibilityLabel="Contraseña"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        onPress={() => void manejarAccion("login")}
        disabled={cargando}
        style={styles.primaryBtn}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
      >
        <Text style={styles.primaryText}>{cargando ? "Cargando..." : "Iniciar sesión"}</Text>
      </Pressable>
      <Pressable
        onPress={() => void manejarAccion("registro")}
        disabled={cargando}
        style={styles.secondaryBtn}
        accessibilityRole="button"
        accessibilityLabel="Crear cuenta nueva"
      >
        <Text style={styles.secondaryText}>Crear cuenta nueva</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#475569" },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: "#b91c1c", fontSize: 13 },
  primaryBtn: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: "#ffffff", fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#0f766e", fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: { color: "#b91c1c", fontWeight: "700" },
});
