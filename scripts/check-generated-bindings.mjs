import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const bindingsPath = join(repoRoot, "src", "generated", "bindings.ts");
const bindingsPrettierPath = "src/generated/bindings.ts";
const before = existsSync(bindingsPath) ? readFileSync(bindingsPath, "utf8") : null;

function quoteForCmd(arg) {
  return /^[A-Za-z0-9_./:-]+$/.test(arg) ? arg : `"${arg.replaceAll('"', '""')}"`;
}

function runPnpm(args) {
  const options = {
    cwd: repoRoot,
    stdio: "inherit",
  };

  if (process.platform === "win32") {
    const command = `pnpm ${args.map(quoteForCmd).join(" ")}`;
    execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", command], options);
    return;
  }

  execFileSync("pnpm", args, options);
}

runPnpm(["tauri:gen-types"]);

// Format the freshly generated file so the comparison uses the same style
// as the committed version (which passes through prettier on pre-commit).
runPnpm(["exec", "prettier", "--write", bindingsPrettierPath]);

const after = existsSync(bindingsPath) ? readFileSync(bindingsPath, "utf8") : null;
if (before !== after) {
  console.error("Generated bindings were outdated. Review and commit src/generated/bindings.ts.");
  process.exit(1);
}
