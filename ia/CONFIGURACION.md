# Configuración de IA · 02-blog-personal-app

## Capas de seguridad implementadas
1. **Instrucciones del proyecto (`AGENTS.md` + `CLAUDE.md`)**: define stack Expo/React Native, capas, accesibilidad de gestos, uso seguro de sensores y prohibiciones.
2. **Permisos declarativos (`.claude/settings.json`)**:
   - `permissions.deny`: bloquea lectura de `.env*`, `*.keystore`, `*.jks`, `*.pem`, `*.key`, edición de `.claude/**` y comandos `sudo`, `rm -rf`, `curl`, `wget`, `git push --force`, `git reset --hard`.
   - `permissions.ask`: exige confirmación para `git push`, `npm install`, `npx`, `eas`.
   - `blockReadsOutsideWorkingDirectories: true` y `disableBypassPermissionsMode: "disable"`.
3. **Sandbox del sistema (`sandbox` en `.claude/settings.json`)**:
   - `enabled: true`, `failIfUnavailable: true`, `allowUnsandboxedCommands: false`, `denyRead: ["~/"]`, `allowRead: ["."]`, `allowedDomains: ["registry.npmjs.org", "github.com"]`.
4. **Hook `PreToolUse` propio (`.claude/hooks/pre-tool-use.mjs`)**:
   - Intercepta `Read`, `Edit`, `Write` y `Bash`; sale con código `2` y mensaje en `stderr`. Verificado con 10 pruebas (`npm run test:hook`).
5. **Cero secretos en el APK**:
   - `EXPO_PUBLIC_API_URL` es el único valor público; tokens en `expo-secure-store`; sin `firebaseConfig`.
