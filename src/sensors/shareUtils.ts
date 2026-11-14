import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import type { Entrada } from "@/types/entrada";
import { formatearEntradaParaCompartir } from "@/utils/entradaUtils";

export async function compartirEntrada(entrada: Entrada): Promise<"shared" | "copied"> {
  const text = formatearEntradaParaCompartir(entrada);
  try {
    const canShareFile = await Sharing.isAvailableAsync();
    if (canShareFile) {
      const tempFile = new File(Paths.cache, `entrada-${entrada.id}.txt`);
      tempFile.write(text);
      await Sharing.shareAsync(tempFile.uri, {
        mimeType: "text/plain",
        dialogTitle: entrada.titulo,
      });
      return "shared";
    }
    const result = await Share.share({ message: text, title: entrada.titulo });
    if (result.action === Share.sharedAction) {
      return "shared";
    }
  } catch {
    // Fallback al portapapeles si compartir falla o no está disponible
  }
  await Clipboard.setStringAsync(text);
  return "copied";
}
