const SEA_LEVEL_PRESSURE_HPA = 1013.25;

/**
 * Calcula la altitud aproximada en metros sobre el nivel del mar
 * a partir de la presión barométrica en hPa (fórmula barométrica internacional).
 */
export function calcularAltitudDesdePresion(pressureHpa: number): number | null {
  if (!Number.isFinite(pressureHpa) || pressureHpa <= 0) return null;
  const altitude = 44330 * (1 - Math.pow(pressureHpa / SEA_LEVEL_PRESSURE_HPA, 1 / 5.255));
  return Math.round(altitude);
}

export function formatearAltitud(altitudM: number | null): string | null {
  if (altitudM === null || !Number.isFinite(altitudM)) return null;
  return `Escrita a ${Math.round(altitudM).toLocaleString("es-CO")} m s. n. m.`;
}
