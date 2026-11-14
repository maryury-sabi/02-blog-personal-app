# Bitácora de trabajo con IA · 02-blog-personal-app

| Fecha      | Propósito                                                             | Evidencia                                                              | Validación                         | Decisión                   |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- | -------------------------- |
| 2026-11-14 | Configurar reglas de IA, calidad y hook `PreToolUse` en primer commit | `AGENTS.md`, `.claude/settings.json`, `.claude/hooks/pre-tool-use.mjs` | `npm run test:hook` (10/10)        | Aceptado en commit inicial |
| 2026-11-14 | Implementar SQLite, gestos, sensores, pantallas y pruebas Jest        | `app/`, `src/`, `__tests__/`                                           | `npm run check` + cobertura >= 80% | Aceptado tras revisar diff |

## Casos en los que se rechazó o corrigió a la IA

1. **Guardar JWT en `AsyncStorage`:** Rechazado; se usó `expo-secure-store` como exige la lista de verificación de seguridad.
2. **Gestos sin alternativa accesible:** Corregido; cada gesto (`Pan`, `Tap` doble, `LongPress`, `Pinch`) tiene su botón equivalente con `accessibilityLabel`.
3. **Llamar sensores sin `isAvailableAsync()`:** Corregido; se añadió verificación previa y alternativa manual si no hay barómetro o GPS.
