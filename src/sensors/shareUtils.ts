import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import type { Entrada } from "@/types/entrada";
import { formatearEntradaParaCompartir } from "@/utils/entradaUtils";

export async function compartirEntrada(entrada: Entrada): Promise<"shared" | "copied"> {
  const text = formatearEntradaParaCompartir(entrada);
  try {
    const canShareFile = await Sharing.isAvailableAsync();
    if (canShareFile && FileSystem.cacheDirectory) {
      const fileUri = `${FileSystem.cacheDirectory}entrada-${entrada.id}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
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
