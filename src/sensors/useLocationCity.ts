import * as Location from "expo-location";
import { useState } from "react";

export interface LocationCityResult {
  ciudad: string | null;
  cargando: boolean;
  error: string | null;
  detectarCiudad: () => Promise<string | null>;
}

export function useLocationCity(): LocationCityResult {
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function detectarCiudad(): Promise<string | null> {
    setCargando(true);
    setError(null);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Activa la ubicación del dispositivo o escríbela manualmente.");
        return null;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de ubicación denegado. Puedes escribir tu ciudad manualmente.");
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const first = places[0];
      const detected = first?.city ?? first?.subregion ?? first?.region ?? null;
      setCiudad(detected);
      return detected;
    } catch {
      setError("No se pudo obtener la ubicación. Escríbela manualmente.");
      return null;
    } finally {
      setCargando(false);
    }
  }

  return { ciudad, cargando, error, detectarCiudad };
}
