import path from "node:path";
import { fileURLToPath } from "node:url";

const SECRET_FILE_PATTERNS = [
  /(^|[\\/])\.env(\.|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /firebase-adminsdk.*\.json$/i,
  /\.keystore$/i,
  /\.jks$/i,
];

const BLOCKED_BASH_PATTERNS = [
  /(^|\s|\/)curl(\s|$)/i,
  /(^|\s|\/)wget(\s|$)/i,
  /(^|\s|\/)sudo(\s|$)/i,
  /rm\s+-rf\s+/i,
  /git\s+push\s+--force/i,
  /git\s+reset\s+--hard/i,
  /(^|[\\/])\.env(\.|\s|$)/i,
];

export function isSecretPath(targetPath) {
  if (!targetPath) return false;
  return SECRET_FILE_PATTERNS.some((re) => re.test(targetPath));
}

export function isOutsideProject(targetPath, projectRoot) {
  if (!targetPath) return false;
  if (targetPath.startsWith("~")) return true;
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return rel.startsWith("..") || path.isAbsolute(rel);
}

export function isProtectedConfigEdit(toolName, targetPath, projectRoot) {
  if (toolName !== "Edit" && toolName !== "Write") return false;
  if (!targetPath) return false;
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  const rel = path.relative(resolvedRoot, resolvedTarget).replace(/\\/g, "/");
  return rel === ".claude" || rel.startsWith(".claude/");
}

export function evaluateToolCall(payload, projectRoot = process.cwd()) {
  const toolName = String(payload?.tool_name ?? "");
  const input = payload?.tool_input ?? {};

  if (toolName === "Bash") {
    const command = String(input.command ?? "");
    for (const pattern of BLOCKED_BASH_PATTERNS) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `Comando bloqueado por política de seguridad: ${pattern}`,
        };
      }
    }
    if (/\.\.[\\/]/.test(command) || /(^|\s)~[\\/]/.test(command)) {
      return {
        allowed: false,
        reason: "Acceso fuera de la carpeta del proyecto bloqueado.",
      };
    }
    return { allowed: true, reason: "" };
  }

  const candidatePath = String(input.file_path ?? input.path ?? "");
  if (isSecretPath(candidatePath)) {
    return {
      allowed: false,
      reason: `Lectura/escritura de archivo sensible bloqueada: ${candidatePath}`,
    };
  }
  if (isOutsideProject(candidatePath, projectRoot)) {
    return {
      allowed: false,
      reason: `Ruta fuera del proyecto bloqueada: ${candidatePath}`,
    };
  }
  if (isProtectedConfigEdit(toolName, candidatePath, projectRoot)) {
    return {
      allowed: false,
      reason: "La IA no puede modificar su propia configuración en .claude/.",
    };
  }
  return { allowed: true, reason: "" };
}

async function runCli() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  const payload = raw ? JSON.parse(raw) : {};
  const result = evaluateToolCall(payload, process.cwd());
  if (!result.allowed) {
    process.stderr.write(`BLOQUEADO [PreToolUse]: ${result.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runCli().catch((err) => {
    process.stderr.write(`Error en PreToolUse hook: ${String(err)}\n`);
    process.exit(2);
  });
}
