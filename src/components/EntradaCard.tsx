import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import type { Entrada } from "@/types/entrada";
import { fechaRelativa, tiempoDeLectura } from "@/utils/entradaUtils";

interface EntradaCardProps {
  entrada: Entrada;
  onPress: () => void;
  onToggleDestacada: () => void;
  onCompartir: () => void;
  onEliminar: () => void;
}

export function EntradaCard({
  entrada,
  onPress,
  onToggleDestacada,
  onCompartir,
  onEliminar,
}: EntradaCardProps) {
  const abrirMenuRapido = () => {
    Alert.alert(entrada.titulo, "Acciones rápidas", [
      { text: "Compartir", onPress: onCompartir },
      { text: "Eliminar", style: "destructive", onPress: onEliminar },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(onToggleDestacada)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => {
      runOnJS(abrirMenuRapido)();
    });

  const composed = Gesture.Race(doubleTap, longPress);
  const mins = tiempoDeLectura(entrada.contenido);

  return (
    <GestureDetector gesture={composed}>
      <Pressable
        onPress={onPress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Abrir entrada ${entrada.titulo}`}
      >
        <View style={styles.headerRow}>
          <Text style={styles.meta}>
            {fechaRelativa(entrada.creado_en)} · {mins} min de lectura
          </Text>
          <View style={styles.actionsRow}>
            {entrada.borrador ? <Text style={styles.draftBadge}>Borrador</Text> : null}
            <Pressable
              onPress={onToggleDestacada}
              accessibilityRole="button"
              accessibilityLabel="Marcar o desmarcar entrada destacada"
              style={styles.iconBtn}
            >
              <Text style={styles.iconText}>{entrada.destacada ? "★" : "☆"}</Text>
            </Pressable>
            <Pressable
              onPress={abrirMenuRapido}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú rápido de entrada"
              style={styles.iconBtn}
            >
              <Text style={styles.iconText}>⋮</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.title}>{entrada.titulo}</Text>
        <Text numberOfLines={2} style={styles.excerpt}>
          {entrada.contenido}
        </Text>
        {entrada.foto_uri ? (
          <Image source={{ uri: entrada.foto_uri }} style={styles.thumb} />
        ) : null}
        {entrada.etiquetas.length > 0 ? (
          <View style={styles.tagsRow}>
            {entrada.etiquetas.map((tag) => (
              <Text key={tag} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  meta: { fontSize: 12, color: "#64748b" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  draftBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 18, color: "#0f766e" },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  excerpt: { fontSize: 14, color: "#475569", lineHeight: 20 },
  thumb: { width: "100%", height: 140, borderRadius: 8, marginTop: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    fontSize: 12,
    color: "#0f766e",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
