import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { getDatabase } from "@/db/database";
import { eliminarEtiqueta, obtenerEntradas, obtenerEtiquetas } from "@/services/entradaService";
import type { Entrada, EtiquetaResumen } from "@/types/entrada";

export default function EtiquetasScreen() {
  const router = useRouter();
  const [etiquetas, setEtiquetas] = useState<EtiquetaResumen[]>([]);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const cargar = useCallback(async () => {
    const db = await getDatabase();
    const list = await obtenerEtiquetas(db);
    setEtiquetas(list);
    if (seleccionada) {
      const filtradas = await obtenerEntradas(db, seleccionada);
      setEntradas(filtradas.filter((e) => e.etiquetas.includes(seleccionada)));
    }
  }, [seleccionada]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const irAEntradas = () => router.push("/(tabs)");
  const panToFeed = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((e) => {
      if (e.translationX > 60) {
        runOnJS(irAEntradas)();
      }
    });

  function confirmarEliminar(tag: EtiquetaResumen) {
    Alert.alert(
      `Eliminar #${tag.nombre}`,
      "Las entradas asociadas NO se borrarán, solo perderán esta etiqueta.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const db = await getDatabase();
            await eliminarEtiqueta(db, tag.id);
            if (seleccionada === tag.nombre) {
              setSeleccionada(null);
              setEntradas([]);
            }
            await cargar();
          },
        },
      ],
    );
  }

  return (
    <GestureDetector gesture={panToFeed}>
      <View style={styles.container}>
        <FlatList
          data={etiquetas}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>No hay etiquetas registradas.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tagRow}>
              <Pressable
                onPress={async () => {
                  setSeleccionada(item.nombre);
                  const db = await getDatabase();
                  const list = await obtenerEntradas(db, item.nombre);
                  setEntradas(list.filter((e) => e.etiquetas.includes(item.nombre)));
                }}
                style={styles.tagBtn}
                accessibilityRole="button"
                accessibilityLabel={`Ver entradas con etiqueta ${item.nombre}`}
              >
                <Text style={styles.tagName}>#{item.nombre}</Text>
                <Text style={styles.tagCount}>{item.total} entradas</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmarEliminar(item)}
                style={styles.delBtn}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar etiqueta ${item.nombre}`}
              >
                <Text style={styles.delText}>Borrar</Text>
              </Pressable>
            </View>
          )}
        />

        {seleccionada ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Entradas en #{seleccionada}</Text>
            {entradas.map((e) => (
              <Pressable key={e.id} onPress={() => router.push(`/entrada/${e.id}`)}>
                <Text style={styles.entryLink}>• {e.titulo}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 14 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 32 },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tagBtn: { flex: 1 },
  tagName: { fontSize: 16, fontWeight: "700", color: "#0f766e" },
  tagCount: { fontSize: 12, color: "#64748b" },
  delBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  delText: { color: "#b91c1c", fontWeight: "700" },
  previewBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  previewTitle: { fontWeight: "700", marginBottom: 6, color: "#0f172a" },
  entryLink: { color: "#0f766e", paddingVertical: 4, fontSize: 14 },
});
