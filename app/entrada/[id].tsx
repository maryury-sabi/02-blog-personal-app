import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { getDatabase } from "@/db/database";
import { guardarPreferencia, obtenerPreferencia } from "@/repositories/entradaRepository";
import { formatearAltitud } from "@/sensors/barometerUtils";
import { compartirEntrada } from "@/sensors/shareUtils";
import {
  alternarDestacada,
  eliminarEntrada,
  guardarEntrada,
  obtenerEntrada,
} from "@/services/entradaService";
import type { Entrada } from "@/types/entrada";
import {
  fechaRelativa,
  parsearMarkdownBasico,
  tiempoDeLectura,
  type MarkdownLine,
} from "@/utils/entradaUtils";

const MIN_FONT = 13;
const MAX_FONT = 24;

function DetalleToolbar({
  destacada,
  onZoom,
  onToggleDestacada,
  onShare,
}: {
  destacada: boolean;
  onZoom: (delta: number) => void;
  onToggleDestacada: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.toolbar}>
      <Pressable
        onPress={() => onZoom(-2)}
        style={styles.toolBtn}
        accessibilityRole="button"
        accessibilityLabel="Disminuir tamaño de letra"
      >
        <Text style={styles.toolText}>A-</Text>
      </Pressable>
      <Pressable
        onPress={() => onZoom(2)}
        style={styles.toolBtn}
        accessibilityRole="button"
        accessibilityLabel="Aumentar tamaño de letra"
      >
        <Text style={styles.toolText}>A+</Text>
      </Pressable>
      <Pressable
        onPress={onToggleDestacada}
        style={styles.toolBtn}
        accessibilityRole="button"
        accessibilityLabel="Destacar entrada"
      >
        <Text style={styles.toolText}>{destacada ? "★ Destacada" : "☆ Destacar"}</Text>
      </Pressable>
      <Pressable
        onPress={onShare}
        style={styles.toolBtn}
        accessibilityRole="button"
        accessibilityLabel="Compartir entrada"
      >
        <Text style={styles.toolText}>Compartir</Text>
      </Pressable>
    </View>
  );
}

function MarkdownBody({ lines, fontSize }: { lines: MarkdownLine[]; fontSize: number }) {
  return (
    <View style={styles.body}>
      {lines.map((line, idx) => (
        <Text key={idx} style={[styles.paragraph, { fontSize, lineHeight: fontSize * 1.45 }]}>
          {line.isBullet ? "• " : ""}
          {line.segments.map((seg, sIdx) => (
            <Text key={sIdx} style={seg.bold ? styles.bold : undefined}>
              {seg.text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}

function confirmarBorrado(id: number, onDeleted: () => void) {
  Alert.alert("Eliminar entrada", "¿Seguro que deseas eliminar esta entrada?", [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Eliminar",
      style: "destructive",
      onPress: async () => {
        const db = await getDatabase();
        await eliminarEntrada(db, id);
        onDeleted();
      },
    },
  ]);
}

export default function DetalleEntradaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entrada, setEntrada] = useState<Entrada | null>(null);
  const [fontSize, setFontSize] = useState(16);

  const recargar = useCallback(async () => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    const db = await getDatabase();
    const item = await obtenerEntrada(db, numId);
    setEntrada(item);
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    getDatabase()
      .then(async (db) => {
        const [item, savedSize] = await Promise.all([
          obtenerEntrada(db, numId),
          obtenerPreferencia(db, "font_size"),
        ]);
        if (!mounted) return;
        setEntrada(item);
        const parsed = savedSize ? Number(savedSize) : 16;
        if (parsed >= MIN_FONT && parsed <= MAX_FONT) setFontSize(parsed);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [id]);

  async function cambiarTamano(delta: number) {
    const next = Math.min(MAX_FONT, Math.max(MIN_FONT, fontSize + delta));
    setFontSize(next);
    const db = await getDatabase();
    await guardarPreferencia(db, "font_size", String(next));
  }

  const pinchGesture = Gesture.Pinch().onEnd((e) => {
    const delta = e.scale > 1.05 ? 2 : e.scale < 0.95 ? -2 : 0;
    if (delta !== 0) runOnJS(cambiarTamano)(delta);
  });

  if (!entrada) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Entrada no encontrada.</Text>
      </View>
    );
  }

  const altitudText = formatearAltitud(entrada.altitud_m);

  return (
    <GestureDetector gesture={pinchGesture}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{entrada.titulo}</Text>
        <Text style={styles.meta}>
          {fechaRelativa(entrada.creado_en)} · {tiempoDeLectura(entrada.contenido)} min de lectura
          {entrada.lugar ? ` · ${entrada.lugar}` : ""}
        </Text>
        {altitudText ? <Text style={styles.altitud}>{altitudText}</Text> : null}
        <DetalleToolbar
          destacada={entrada.destacada}
          onZoom={(d) => void cambiarTamano(d)}
          onToggleDestacada={async () => {
            const db = await getDatabase();
            await alternarDestacada(db, entrada.id, !entrada.destacada);
            await recargar();
          }}
          onShare={() => void compartirEntrada(entrada)}
        />
        {entrada.foto_uri ? (
          <Image source={{ uri: entrada.foto_uri }} style={styles.photo} />
        ) : null}
        <MarkdownBody lines={parsearMarkdownBasico(entrada.contenido)} fontSize={fontSize} />
        {entrada.borrador ? (
          <Pressable
            onPress={async () => {
              const db = await getDatabase();
              await guardarEntrada(db, { ...entrada, borrador: false });
              await recargar();
            }}
            style={styles.publishBtn}
            accessibilityRole="button"
            accessibilityLabel="Publicar borrador"
          >
            <Text style={styles.publishText}>Publicar ahora</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => confirmarBorrado(entrada.id, () => router.back())}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel="Eliminar entrada"
        >
          <Text style={styles.deleteText}>Eliminar entrada</Text>
        </Pressable>
      </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 18, gap: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b" },
  altitud: { fontSize: 13, color: "#0f766e", fontWeight: "600" },
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 6 },
  toolBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toolText: { fontWeight: "700", color: "#0f172a", fontSize: 13 },
  photo: { width: "100%", height: 220, borderRadius: 12 },
  body: { gap: 8, marginTop: 6 },
  paragraph: { color: "#1e293b" },
  bold: { fontWeight: "800" },
  publishBtn: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  publishText: { color: "#ffffff", fontWeight: "700" },
  deleteBtn: {
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  deleteText: { color: "#b91c1c", fontWeight: "700" },
});
