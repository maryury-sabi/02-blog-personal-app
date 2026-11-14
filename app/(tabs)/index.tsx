import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { EntradaCard } from "@/components/EntradaCard";
import { useAuth } from "@/context/AuthContext";
import { getDatabase } from "@/db/database";
import { compartirEntrada } from "@/sensors/shareUtils";
import {
  alternarDestacada,
  eliminarEntrada,
  obtenerEntradas,
  sincronizarPendientes,
} from "@/services/entradaService";
import type { Entrada } from "@/types/entrada";

export default function EntradasFeedScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const cargar = useCallback(async (q: string) => {
    const db = await getDatabase();
    const list = await obtenerEntradas(db, q);
    setEntradas(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(busqueda);
    }, [busqueda, cargar]),
  );

  const irAEtiquetas = () => router.push("/(tabs)/etiquetas");

  const panToTags = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((e) => {
      if (e.translationX < -60) {
        runOnJS(irAEtiquetas)();
      }
    });

  async function manejarSync() {
    if (!usuario) {
      router.push("/login");
      return;
    }
    const db = await getDatabase();
    const res = await sincronizarPendientes(db);
    setSyncMsg(`Sincronizado: ${res.enviadas} enviadas, ${res.recibidas} recibidas`);
    await cargar(busqueda);
  }

  return (
    <GestureDetector gesture={panToTags}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TextInput
            value={busqueda}
            onChangeText={(txt) => {
              setBusqueda(txt);
              void cargar(txt);
            }}
            placeholder="Buscar por título, contenido o etiqueta..."
            style={styles.searchInput}
            accessibilityLabel="Buscar entradas"
          />
          <Pressable
            onPress={() => void manejarSync()}
            style={styles.syncBtn}
            accessibilityRole="button"
            accessibilityLabel={usuario ? "Sincronizar entradas" : "Iniciar sesión"}
          >
            <Text style={styles.syncText}>{usuario ? "Sync" : "Cuenta"}</Text>
          </Pressable>
        </View>
        {syncMsg ? <Text style={styles.syncMsg}>{syncMsg}</Text> : null}

        <FlatList
          data={entradas}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>Aún no hay entradas. Pulsa «+ Nueva» para escribir.</Text>
          }
          renderItem={({ item }) => (
            <EntradaCard
              entrada={item}
              onPress={() => router.push(`/entrada/${item.id}`)}
              onToggleDestacada={async () => {
                const db = await getDatabase();
                await alternarDestacada(db, item.id, !item.destacada);
                await cargar(busqueda);
              }}
              onCompartir={() => void compartirEntrada(item)}
              onEliminar={async () => {
                const db = await getDatabase();
                await eliminarEntrada(db, item.id);
                await cargar(busqueda);
              }}
            />
          )}
        />

        <Pressable
          onPress={() => router.push("/entrada/nueva")}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Escribir nueva entrada"
        >
          <Text style={styles.fabText}>+ Nueva</Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 14 },
  topBar: { flexDirection: "row", gap: 8, marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncBtn: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  syncText: { fontWeight: "700", color: "#0f172a" },
  syncMsg: { fontSize: 12, color: "#0f766e", marginBottom: 8 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 40 },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 20,
    backgroundColor: "#0f766e",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
  },
  fabText: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
});
