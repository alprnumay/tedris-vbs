#!/usr/bin/env node
/**
 * Güvenli production yayınlama:
 * 1) build (opsiyonel)
 * 2) yalnızca izinli dosyaları commit
 * 3) git push origin main
 * 4) Vercel Deploy Hook veya CLI ile production deploy tetikle
 *
 * Kullanım:
 *   pnpm deploy:prod -- --message "fix: bildirim ayarları"
 *   pnpm deploy:prod -- --skip-build
 *   pnpm deploy:prod -- --skip-vercel   (yalnızca push)
 *   pnpm deploy:prod -- --vercel-only   (push atlandı, yalnızca Vercel tetikle)
 */

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BLOCKED_PATH_PREFIXES = [
  ".env",
  ".vercel/",
  "load-test-results/",
  "tedris-davet-export/",
  "backups/",
  "node_modules/",
  "uploads/",
  "artifacts/veli-bilgilendirme/.vite-cache/",
  "artifacts/veli-bilgilendirme/dist/",
];

const BLOCKED_BASENAMES = new Set([
  "tmp-login.json",
  ".env",
  ".env.local",
  ".env.production",
]);

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : "inherit",
    ...opts,
  });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function parseArgs(argv) {
  const out = {
    message: process.env.DEPLOY_COMMIT_MESSAGE?.trim() || "",
    skipBuild: false,
    skipPush: false,
    skipVercel: false,
    vercelOnly: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skip-build") out.skipBuild = true;
    else if (arg === "--skip-push") out.skipPush = true;
    else if (arg === "--skip-vercel") out.skipVercel = true;
    else if (arg === "--vercel-only") {
      out.vercelOnly = true;
      out.skipPush = true;
      out.skipBuild = true;
    } else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--message" || arg === "-m") {
      out.message = String(argv[++i] ?? "").trim();
    }
  }

  return out;
}

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function isBlocked(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized);
  if (BLOCKED_BASENAMES.has(base)) return true;
  if (normalized.startsWith(".env")) return true;
  return BLOCKED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix.replace(/\/$/, "") || normalized.startsWith(prefix),
  );
}

function gitStatusPorcelain() {
  const raw = runCapture("git status --porcelain");
  if (!raw) return [];
  return raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const xy = line.slice(0, 2);
    const file = line.slice(3).trim();
    const renamed = file.includes(" -> ");
    const relativePath = renamed ? file.split(" -> ").pop().trim() : file;
    return { xy, relativePath, renamed: renamed ? file : null };
  });
}

function assertMainBranch() {
  const branch = runCapture("git rev-parse --abbrev-ref HEAD");
  if (branch !== "main") {
    throw new Error(`Yalnızca main branch'ten yayınlanır (şu an: ${branch}).`);
  }
}

function collectCommitCandidates() {
  const entries = gitStatusPorcelain();
  const allowed = [];
  const blocked = [];

  for (const entry of entries) {
    if (isBlocked(entry.relativePath)) {
      blocked.push(entry.relativePath);
      continue;
    }
    if (entry.xy.includes("?")) {
      blocked.push(`${entry.relativePath} (untracked — commit'e alınmaz)`);
      continue;
    }
    allowed.push(entry.relativePath);
  }

  return { allowed, blocked };
}

function commitAllowedChanges(message, dryRun) {
  const { allowed, blocked } = collectCommitCandidates();

  if (blocked.length) {
    console.log("\n[deploy] Commit dışı bırakılan yollar:");
    for (const item of blocked) console.log(`  - ${item}`);
  }

  if (allowed.length === 0) {
    console.log("[deploy] Commit gerektiren izinli değişiklik yok.");
    return false;
  }

  if (!message) {
    throw new Error(
      'Commit gerekiyor. Mesaj verin: pnpm deploy:prod -- --message "fix: açıklama"',
    );
  }

  console.log("\n[deploy] Commit edilecek dosyalar:");
  for (const file of allowed) console.log(`  + ${file}`);

  if (dryRun) {
    console.log("[deploy] dry-run: commit atlanıyor.");
    return true;
  }

  for (const file of allowed) {
    const result = spawnSync("git", ["add", "--", file], { cwd: ROOT, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`git add başarısız: ${file}`);
  }
  const commitResult = spawnSync("git", ["commit", "-m", message], { cwd: ROOT, stdio: "inherit" });
  if (commitResult.status !== 0) throw new Error("git commit başarısız.");
  return true;
}

function pushMain(dryRun) {
  const local = runCapture("git rev-parse HEAD");
  let remote = "";
  try {
    remote = runCapture("git rev-parse origin/main");
  } catch {
    remote = "";
  }

  if (local === remote) {
    console.log(`[deploy] origin/main zaten güncel (${local.slice(0, 7)}).`);
  }

  if (dryRun) {
    console.log("[deploy] dry-run: git push origin main atlanıyor.");
    return local;
  }

  run("git push origin main");
  const after = runCapture("git rev-parse HEAD");
  const originAfter = runCapture("git rev-parse origin/main");
  if (after !== originAfter) {
    throw new Error("Push sonrası origin/main ile HEAD eşleşmiyor.");
  }
  console.log(`[deploy] GitHub main güncellendi: ${after.slice(0, 7)}`);
  return after;
}

async function triggerVercelDeploy(dryRun) {
  const hook = process.env.VERCEL_DEPLOY_HOOK?.trim();
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectJsonPath = path.join(ROOT, ".vercel", "project.json");

  if (hook) {
    console.log("[deploy] Vercel Deploy Hook tetikleniyor…");
    if (dryRun) {
      console.log("[deploy] dry-run: deploy hook atlanıyor.");
      return "hook-dry-run";
    }
    const res = await fetch(hook, { method: "POST" });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Deploy Hook başarısız (${res.status}): ${text.slice(0, 200)}`);
    }
    console.log("[deploy] Vercel Deploy Hook OK:", text.slice(0, 200) || "(empty body)");
    return "hook";
  }

  if (token && fs.existsSync(projectJsonPath)) {
    console.log("[deploy] Vercel CLI ile production deploy…");
    if (dryRun) {
      console.log("[deploy] dry-run: vercel deploy atlanıyor.");
      return "cli-dry-run";
    }
    const result = spawnSync(
      "npx",
      ["vercel", "deploy", "--prod", "--yes", "--token", token],
      { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (result.status !== 0) {
      throw new Error("Vercel CLI deploy başarısız.");
    }
    return "cli";
  }

  console.warn("\n[deploy] UYARI: Otomatik Vercel tetikleme yapılandırılmamış.");
  console.warn("  Seçenek A — Deploy Hook (önerilen):");
  console.warn("    Vercel → Project → Settings → Git → Deploy Hooks → Production");
  console.warn("    URL'yi .env içine VERCEL_DEPLOY_HOOK=... olarak kaydedin.");
  console.warn("  Seçenek B — Vercel CLI:");
  console.warn("    npx vercel link  (proje: tedris-vbs-api-server)");
  console.warn("    .env içine VERCEL_TOKEN=... ekleyin");
  console.warn("  Seçenek C — GitHub Actions yedek:");
  console.warn("    GitHub repo → Settings → Secrets → VERCEL_DEPLOY_HOOK");
  return "none";
}

function printSummary({ head, vercelMode, blockedCount }) {
  console.log("\n=== Yayınlama özeti ===");
  console.log(`GitHub main HEAD: ${head.slice(0, 7)}`);
  console.log(`Vercel tetikleme: ${vercelMode}`);
  if (blockedCount > 0) {
    console.log(`Commit dışı bırakılan yol: ${blockedCount}`);
  }
  console.log("Kontrol: Vercel → Deployments → yeni satır + commit hash eşleşmesi");
  console.log("Canlı: https://www.nehariplatform.com.tr");
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));

  assertMainBranch();

  if (!args.skipBuild) {
    console.log("[deploy] build:veli-bilgilendirme çalıştırılıyor…");
    if (!args.dryRun) {
      run("pnpm run build:veli-bilgilendirme");
    } else {
      console.log("[deploy] dry-run: build atlanıyor.");
    }
  }

  if (!args.skipPush) {
    commitAllowedChanges(args.message, args.dryRun);
  }

  let head = runCapture("git rev-parse HEAD");
  if (!args.skipPush) {
    head = pushMain(args.dryRun);
  }

  let vercelMode = "skipped";
  if (!args.skipVercel) {
    vercelMode = await triggerVercelDeploy(args.dryRun);
  }

  const blockedCount = collectCommitCandidates().blocked.length;
  printSummary({ head, vercelMode, blockedCount });
}

main().catch((err) => {
  console.error("\n[deploy] HATA:", err instanceof Error ? err.message : err);
  process.exit(1);
});
