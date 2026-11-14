import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Barometer } from "expo-sensors";
import { calcularAltitudDesdePresion } from "@/sensors/barometerUtils";

export interface BarometerState {
  disponible: boolean;
  altitudM: number | null;
}

export function useBarometerAltitude(activo: boolean): BarometerState {
  const [disponible, setDisponible] = useState(false);
  const [altitudM, setAltitudM] = useState<number | null>(null);

  useEffect(() => {
    if (!activo) return;
    let mounted = true;
    let subscription: { remove: () => void } | null = null;

    async function iniciar() {
      try {
        const available = await Barometer.isAvailableAsync();
        if (!mounted) return;
        setDisponible(available);
        if (!available) return;

        Barometer.setUpdateInterval(1000);
        subscription = Barometer.addListener((data) => {
          if (!mounted) return;
          if (Platform.OS === "ios" && typeof data.relativeAltitude === "number") {
            setAltitudM(Math.round(data.relativeAltitude));
            return;
          }
          const calc = calcularAltitudDesdePresion(data.pressure);
          if (calc !== null) setAltitudM(calc);
        });
      } catch {
        if (mounted) setDisponible(false);
      }
    }

    void iniciar();
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [activo]);

  return { disponible, altitudM };
}
