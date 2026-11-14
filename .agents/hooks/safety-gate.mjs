import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SECRET_FILE_PATTERNS = [
  /(^|[\\/])\.env(\.|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /firebase-adminsdk.*\.json$/i,
  /\.keystore$/i,
  /\.jks$/i,
];

const DENY_CMD_PATTERNS = [
  /(^|\s|[\\/])curl(\.exe)?(\s|$)/i,
  /(^|\s|[\\/])wget(\.exe)?(\s|$)/i,
  /(^|\s)sudo(\s|$)/i,
  /rm\s+-rf(\s|$)/i,
  /vercel\s+env\s+pull/i,
  /git\s+push\s+(--force|-f)/i,
  /git\s+reset\s+--hard/i,
  /(^|\s|['"\\/])\.env(\.[a-z0-9_-]+)?(\s|['"]|$)/i,
  /CANARIO/i,
  /(^|\s)\.\.([\\/]|$)/,
  /(^|\s)~[\\/]/,
];

const ASK_CMD_PATTERNS = [
  /(^|\s)git\s+push(\s|$)/i,
  /(^|\s)npm\s+(install|i)(\s|$)/i,
  /(^|\s)npx\s+/i,
  /(^|\s)vercel(\s|$)/i,
  /(^|\s)eas(\s|$)/i,
];

export function evaluateAntigravityTool(payload, repoRoot = DEFAULT_REPO_ROOT) {
  const toolName = String(payload?.toolCall?.name ?? "");
  const args = payload?.toolCall?.args ?? {};
  const resolvedRoot = path.resolve(repoRoot);

  if (toolName === "run_command") {
    const cmd = String(args.CommandLine ?? "");
    for (const pattern of DENY_CMD_PATTERNS) {
      if (pattern.test(cmd)) {
        return {
          decision: "deny",
          reason: `BLOQUEADO por política de seguridad (comando prohibido): ${pattern}`,
        };
      }
    }
    for (const pattern of ASK_CMD_PATTERNS) {
      if (pattern.test(cmd)) {
        return {
          decision: "ask",
          reason: "Esta acción tiene efecto externo y requiere confirmación del usuario.",
        };
      }
    }
    return { decision: "allow" };
  }

  const targetPath = String(
    args.Path ?? args.SearchPath ?? args.DirectoryPath ?? args.file_path ?? "",
  );
  if (!targetPath) {
    return { decision: "allow" };
  }

  if (SECRET_FILE_PATTERNS.some((re) => re.test(targetPath))) {
    return {
      decision: "deny",
      reason: `BLOQUEADO: acceso a archivo sensible denegado (${path.basename(targetPath)}).`,
    };
  }

  if (targetPath.startsWith("~")) {
    return {
      decision: "deny",
      reason: "BLOQUEADO: no se permite acceder a la carpeta personal (~).",
    };
  }

  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return {
      decision: "deny",
      reason: `BLOQUEADO: no se permite salir de la raíz del repositorio (${targetPath}).`,
    };
  }

  const normRel = rel.replace(/\\/g, "/");
  const isModify = toolName === "edit_file" || toolName === "write_file";
  if (
    isModify &&
    (normRel.startsWith(".claude/") ||
      normRel === ".claude" ||
      normRel.startsWith(".agents/") ||
      normRel === ".agents")
  ) {
    return {
      decision: "deny",
      reason: "BLOQUEADO: la IA no puede modificar su propia configuración de seguridad.",
    };
  }

  return { decision: "allow" };
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  const payload = raw ? JSON.parse(raw) : {};
  const result = evaluateAntigravityTool(payload);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((err) => {
    process.stdout.write(
      `${JSON.stringify({ decision: "deny", reason: `Error en safety-gate: ${String(err)}` })}\n`,
    );
  });
}
