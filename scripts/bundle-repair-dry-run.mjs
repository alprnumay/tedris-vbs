import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "api/lib/repair-dry-run.cjs");
const entry = join(root, "server/tedris-repair/diagnoseOnlyEntry.ts");

mkdirSync(dirname(outFile), { recursive: true });

const esbuildVer = process.env.ESBUILD_VERSION || "0.25.0";
execSync(
  `npx --yes esbuild@${esbuildVer} "${entry}" --bundle --platform=node --target=node20 --format=cjs --outfile="${outFile}"`,
  { cwd: root, stdio: "inherit" },
);

console.log("[bundle-repair-dry-run] wrote", outFile);
