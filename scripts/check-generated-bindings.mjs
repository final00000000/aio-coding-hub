import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const bindingsPath = join(repoRoot, "src", "generated", "bindings.ts");
const before = existsSync(bindingsPath) ? readFileSync(bindingsPath, "utf8") : null;

execFileSync("pnpm", ["tauri:gen-types"], {
  cwd: repoRoot,
  stdio: "inherit",
});

const after = existsSync(bindingsPath) ? readFileSync(bindingsPath, "utf8") : null;
if (before !== after) {
  console.error("Generated bindings were outdated. Review and commit src/generated/bindings.ts.");
  process.exit(1);
}
