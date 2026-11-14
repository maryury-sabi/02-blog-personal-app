import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { EntradaForm, type EntradaFormValues } from "@/components/EntradaForm";
import { getDatabase } from "@/db/database";
import { seleccionarYReducirFoto } from "@/sensors/imageUtils";
import { useBarometerAltitude } from "@/sensors/useBarometerAltitude";
import { useLocationCity } from "@/sensors/useLocationCity";
import { guardarEntrada } from "@/services/entradaService";
import { normalizarEtiquetas } from "@/utils/entradaUtils";

const INITIAL_VALUES: EntradaFormValues = {
  titulo: "",
  contenido: "",
  etiquetasTexto: "",
  lugar: "",
  altitudM: null,
  fotoUri: null,
};

export default function NuevaEntradaScreen() {
  const router = useRouter();
  const [values, setValues] = useState<EntradaFormValues>(INITIAL_VALUES);
  const [guardado, setGuardado] = useState(false);
  const { cargando: cityLoading, detectarCiudad } = useLocationCity();
  const { altitudM } = useBarometerAltitude(true);

  const effectiveValues: EntradaFormValues = {
    ...values,
    altitudM: values.altitudM ?? altitudM,
  };

  const hayCambios =
    !guardado &&
    (values.titulo.trim().length > 0 ||
      values.contenido.trim().length > 0 ||
      values.fotoUri !== null);

  const confirmarSalida = useCallback(() => {
    if (!hayCambios) {
      router.back();
      return true;
    }
    Alert.alert("Cambios sin guardar", "¿Deseas salir y descartar lo escrito?", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => router.back() },
    ]);
    return true;
  }, [hayCambios, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", confirmarSalida);
    return () => sub.remove();
  }, [confirmarSalida]);

  async function manejarGuardar(borrador: boolean) {
    const db = await getDatabase();
    await guardarEntrada(db, {
      titulo: effectiveValues.titulo,
      contenido: effectiveValues.contenido,
      etiquetas: normalizarEtiquetas(effectiveValues.etiquetasTexto.split(",")),
      borrador,
      destacada: false,
      lugar: effectiveValues.lugar.trim() || null,
      altitud_m: effectiveValues.altitudM,
      foto_uri: effectiveValues.fotoUri,
      foto_url: null,
    });
    setGuardado(true);
    router.back();
  }

  return (
    <EntradaForm
      values={effectiveValues}
      onChange={setValues}
      cityLoading={cityLoading}
      onDetectCity={async () => {
        const city = await detectarCiudad();
        if (city) setValues((prev) => ({ ...prev, lugar: city }));
      }}
      onPickFoto={async () => {
        const uri = await seleccionarYReducirFoto();
        if (uri) setValues((prev) => ({ ...prev, fotoUri: uri }));
      }}
      onSaveDraft={() => void manejarGuardar(true)}
      onPublish={() => void manejarGuardar(false)}
    />
  );
}
