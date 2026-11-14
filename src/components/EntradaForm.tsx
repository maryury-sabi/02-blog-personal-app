import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { normalizarEtiquetas, validarEntrada } from "@/utils/entradaUtils";

export interface EntradaFormValues {
  titulo: string;
  contenido: string;
  etiquetasTexto: string;
  lugar: string;
  altitudM: number | null;
  fotoUri: string | null;
}

interface EntradaFormProps {
  values: EntradaFormValues;
  onChange: (next: EntradaFormValues) => void;
  onPickFoto: () => void;
  onDetectCity: () => void;
  cityLoading: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function EntradaForm({
  values,
  onChange,
  onPickFoto,
  onDetectCity,
  cityLoading,
  onSaveDraft,
  onPublish,
}: EntradaFormProps) {
  const tags = normalizarEtiquetas(values.etiquetasTexto.split(","));
  const validacion = validarEntrada(values.titulo, values.contenido, tags);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Título (3 a 80 caracteres)</Text>
      <TextInput
        value={values.titulo}
        onChangeText={(titulo) => onChange({ ...values, titulo })}
        placeholder="Ej. Tarde de lluvia en la montaña"
        style={styles.input}
        accessibilityLabel="Título de la entrada"
      />
      {validacion.errores.titulo ? (
        <Text style={styles.errorText}>{validacion.errores.titulo}</Text>
      ) : null}

      <Text style={styles.label}>Contenido (soporta **negrita** y listas - )</Text>
      <TextInput
        value={values.contenido}
        onChangeText={(contenido) => onChange({ ...values, contenido })}
        placeholder="Escribe tus notas del día..."
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.textArea]}
        accessibilityLabel="Contenido de la entrada"
      />
      {validacion.errores.contenido ? (
        <Text style={styles.errorText}>{validacion.errores.contenido}</Text>
      ) : null}

      <Text style={styles.label}>Etiquetas (separadas por coma, máx. 5)</Text>
      <TextInput
        value={values.etiquetasTexto}
        onChangeText={(etiquetasTexto) => onChange({ ...values, etiquetasTexto })}
        placeholder="diario, viaje, ideas"
        style={styles.input}
        accessibilityLabel="Etiquetas de la entrada"
      />

      <Text style={styles.label}>Lugar</Text>
      <View style={styles.row}>
        <TextInput
          value={values.lugar}
          onChangeText={(lugar) => onChange({ ...values, lugar })}
          placeholder="Ciudad o lugar"
          style={[styles.input, styles.flex1]}
          accessibilityLabel="Lugar donde se escribe"
        />
        <Pressable
          onPress={onDetectCity}
          style={styles.secondaryBtn}
          accessibilityRole="button"
          accessibilityLabel="Detectar ciudad por GPS"
        >
          <Text style={styles.secondaryBtnText}>{cityLoading ? "..." : "GPS"}</Text>
        </Pressable>
      </View>

      {values.altitudM !== null ? (
        <Text style={styles.altitudText}>Altitud detectada: {values.altitudM} m s. n. m.</Text>
      ) : null}

      <Pressable
        onPress={onPickFoto}
        style={styles.secondaryBtn}
        accessibilityRole="button"
        accessibilityLabel="Adjuntar foto"
      >
        <Text style={styles.secondaryBtnText}>
          {values.fotoUri ? "Cambiar foto" : "Adjuntar foto"}
        </Text>
      </Pressable>
      {values.fotoUri ? <Image source={{ uri: values.fotoUri }} style={styles.preview} /> : null}

      <View style={styles.submitRow}>
        <Pressable
          onPress={onSaveDraft}
          disabled={!validacion.valido}
          style={[styles.draftBtn, !validacion.valido && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Guardar borrador"
        >
          <Text style={styles.draftBtnText}>Guardar borrador</Text>
        </Pressable>
        <Pressable
          onPress={onPublish}
          disabled={!validacion.valido}
          style={[styles.publishBtn, !validacion.valido && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Publicar entrada"
        >
          <Text style={styles.publishBtnText}>Publicar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: "700", color: "#334155" },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: { minHeight: 140 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  flex1: { flex: 1 },
  errorText: { color: "#b91c1c", fontSize: 12 },
  altitudText: { color: "#0f766e", fontSize: 13, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#0f766e", fontWeight: "700" },
  preview: { width: "100%", height: 180, borderRadius: 10 },
  submitRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  draftBtnText: { color: "#0f766e", fontWeight: "700" },
  publishBtn: {
    flex: 1,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  publishBtnText: { color: "#ffffff", fontWeight: "700" },
  disabled: { opacity: 0.45 },
});
