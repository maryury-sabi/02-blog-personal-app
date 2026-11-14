import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
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
  const navigation = useNavigation();
  const [values, setValues] = useState<EntradaFormValues>(INITIAL_VALUES);
  const [guardado, setGuardado] = useState(false);
  const { cargando: cityLoading, detectarCiudad } = useLocationCity();
  const { altitudM } = useBarometerAltitude(true);

  useEffect(() => {
    if (altitudM !== null && values.altitudM === null) {
      setValues((prev) => ({ ...prev, altitudM }));
    }
  }, [altitudM, values.altitudM]);

  const hayCambios =
    !guardado &&
    (values.titulo.trim().length > 0 ||
      values.contenido.trim().length > 0 ||
      values.fotoUri !== null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hayCambios) return;
      e.preventDefault();
      Alert.alert("Cambios sin guardar", "¿Deseas salir y descartar lo escrito?", [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [hayCambios, navigation]);

  async function manejarGuardar(borrador: boolean) {
    const db = await getDatabase();
    await guardarEntrada(db, {
      titulo: values.titulo,
      contenido: values.contenido,
      etiquetas: normalizarEtiquetas(values.etiquetasTexto.split(",")),
      borrador,
      destacada: false,
      lugar: values.lugar.trim() || null,
      altitud_m: values.altitudM,
      foto_uri: values.fotoUri,
      foto_url: null,
    });
    setGuardado(true);
    router.back();
  }

  return (
    <EntradaForm
      values={values}
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
