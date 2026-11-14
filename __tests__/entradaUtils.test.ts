import { calcularAltitudDesdePresion, formatearAltitud } from "@/sensors/barometerUtils";
import type { Entrada } from "@/types/entrada";
import {
  fechaRelativa,
  formatearEntradaParaCompartir,
  generarUuidV4,
  normalizarEtiquetas,
  parsearMarkdownBasico,
  tiempoDeLectura,
  validarEntrada,
} from "@/utils/entradaUtils";

describe("Utilidades de entrada y sensores", () => {
  it("tiempoDeLectura() devuelve minutos según 200 palabras/min", () => {
    expect(tiempoDeLectura("")).toBe(0);
    expect(tiempoDeLectura("hola mundo")).toBe(1);
    const doscientasUna = Array.from({ length: 201 }, () => "palabra").join(" ");
    expect(tiempoDeLectura(doscientasUna)).toBe(2);
    const cuatrocientas = Array.from({ length: 400 }, () => "texto").join(" ");
    expect(tiempoDeLectura(cuatrocientas)).toBe(2);
  });

  it("fechaRelativa() formatea correctamente segundos, minutos, horas, días y meses", () => {
    const now = new Date("2026-11-14T12:00:00.000Z");
    expect(fechaRelativa("invalida", now)).toBe("fecha desconocida");
    expect(fechaRelativa("2026-11-14T11:59:40.000Z", now)).toBe("hace unos segundos");
    expect(fechaRelativa("2026-11-14T11:45:00.000Z", now)).toBe("hace 15 min");
    expect(fechaRelativa("2026-11-14T09:00:00.000Z", now)).toBe("hace 3 h");
    expect(fechaRelativa("2026-11-13T12:00:00.000Z", now)).toBe("hace 1 día");
    expect(fechaRelativa("2026-11-12T12:00:00.000Z", now)).toBe("hace 2 días");
    expect(fechaRelativa("2026-09-01T12:00:00.000Z", now)).toBe("hace 2 meses");
  });

  it("normalizarEtiquetas() pasa a minúsculas, elimina duplicados y limita a 5", () => {
    const res = normalizarEtiquetas(["Viaje", "viaje", " Notas ", "a", "b", "c", "d"]);
    expect(res).toEqual(["viaje", "notas", "a", "b", "c"]);
  });

  it("validarEntrada() exige título 3-80, contenido >= 10 y máx 5 etiquetas", () => {
    expect(validarEntrada("ab", "1234567890", []).valido).toBe(false);
    expect(validarEntrada("Título", "corto", []).valido).toBe(false);
    expect(validarEntrada("Título", "1234567890", ["1", "2", "3", "4", "5", "6"]).valido).toBe(
      false,
    );
    expect(
      validarEntrada("Título válido", "Contenido con suficiente texto.", ["diario"]).valido,
    ).toBe(true);
  });

  it("parsearMarkdownBasico() detecta negritas y listas", () => {
    const lines = parsearMarkdownBasico("- **Importante** recordar\nTexto normal");
    expect(lines[0]?.isBullet).toBe(true);
    expect(lines[0]?.segments[0]).toEqual({ text: "Importante", bold: true });
    expect(lines[1]?.isBullet).toBe(false);
  });

  it("formatearEntradaParaCompartir() y generarUuidV4() generan formato válido", () => {
    const entrada: Entrada = {
      id: 1,
      remote_id: generarUuidV4(),
      titulo: "Mi paseo",
      contenido: "Caminata por la montaña.",
      foto_uri: null,
      foto_url: null,
      borrador: false,
      destacada: false,
      lugar: "Medellín",
      altitud_m: 1500,
      etiquetas: ["viaje"],
      creado_en: "2026-11-14T00:00:00.000Z",
      actualizado_en: "2026-11-14T00:00:00.000Z",
      updated_at: "2026-11-14T00:00:00.000Z",
      deleted: false,
      pending: false,
    };
    const txt = formatearEntradaParaCompartir(entrada);
    expect(txt).toContain("Mi paseo");
    expect(txt).toContain("Medellín");
    expect(txt).toContain("#viaje");
    expect(entrada.remote_id).toHaveLength(36);
  });

  it("calcularAltitudDesdePresion() calcula altitud desde hPa y formatearAltitud() formatea", () => {
    expect(calcularAltitudDesdePresion(1013.25)).toBe(0);
    expect(calcularAltitudDesdePresion(746)).toBeGreaterThan(2400);
    expect(calcularAltitudDesdePresion(-1)).toBeNull();
    expect(formatearAltitud(2600)).toContain("2.600");
    expect(formatearAltitud(null)).toBeNull();
  });
});
