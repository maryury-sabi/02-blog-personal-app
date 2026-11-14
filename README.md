# 02 · Blog personal (diario móvil)

App móvil offline-first en **Expo + React Native + TypeScript + Expo Router** para escribir entradas de diario con título, etiquetas, fotos, ubicación y altitud barométrica.

## Características

- **Offline-first:** SQLite local (`entrada`, `etiqueta`, `entrada_etiqueta`, `preferencias`) con sincronización incremental contra la API en Vercel.
- **Gestos (con alternativa accesible por botón):**
  - Deslizar horizontal (`Pan`) entre «Entradas» y «Etiquetas».
  - Doble toque (`Tap`) para destacar entrada.
  - Pulsación larga (`LongPress`) para menú rápido (compartir / eliminar).
  - Pellizco (`Pinch`) en lectura para ajustar tamaño de letra.
- **Sensores y capacidades:** `expo-sharing` (+ fallback portapapeles), `expo-location` (ciudad por geocodificación inversa + entrada manual), `Barometer` (`expo-sensors` con verificación `isAvailableAsync()`), `expo-image-picker` + `expo-image-manipulator` (reducción a <= 1280 px JPEG 0.7).
- **Seguridad:** cero secretos ni `firebaseConfig` en la app; tokens guardados en `expo-secure-store`.

## Dependencias justificadas

- `expo-sqlite`: persistencia local sin conexión.
- `expo-secure-store`: almacenamiento cifrado de tokens de sesión.
- `react-native-gesture-handler` y `react-native-reanimated`: gestos nativos.
- `expo-sharing`, `expo-clipboard`, `expo-file-system`: compartir entradas como texto.
- `expo-location`, `expo-sensors`, `expo-image-picker`, `expo-image-manipulator`: ubicación, altitud barométrica y fotos optimizadas.

## Puesta en marcha

```bash
cp env.example .env         # Solo EXPO_PUBLIC_API_URL (URL pública, sin secretos)
npm ci
npm run check               # typecheck + lint + format:check + test + test:hook
npx expo start
```
