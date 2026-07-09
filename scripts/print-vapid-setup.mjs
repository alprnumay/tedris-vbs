#!/usr/bin/env node
/**
 * VAPID anahtarı üretir ve canlı ortam env listesini Türkçe yazdırır.
 * Kullanım: pnpm vapid:kurulum
 */
import { execSync } from "node:child_process";

const output = execSync("pnpm --filter @workspace/api-server exec web-push generate-vapid-keys", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const publicKey = output.match(/Public Key:\s*(\S+)/)?.[1] ?? "";
const privateKey = output.match(/Private Key:\s*(\S+)/)?.[1] ?? "";

console.log("\n=== VAPID Anahtarları (güvenli saklayın) ===\n");
console.log(output.trim());
console.log("\n=== Canlı ortam env değişkenleri ===\n");
console.log("Aşağıdaki üç değişkeni HEM VPS api-server HEM Vercel ortamına ekleyin.");
console.log("(Aynı anahtar çifti — farklı olursa abonelik/gönderim çalışmaz.)\n");
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log("VAPID_SUBJECT=mailto:alprn0604@gmail.com");
console.log("\n--- VPS (api.antalyanehari.xyz) ---");
console.log("artifacts/api-server/.env veya sunucu ortam değişkenleri");
console.log("API sunucusunu yeniden başlatın.\n");
console.log("--- Vercel (nehariplatform.com.tr) ---");
console.log("Project → Settings → Environment Variables → Production");
console.log("Ayrıca: DATABASE_URL (VPS ile aynı PostgreSQL — günlük cron hatırlatması için)\n");
console.log("--- Güvenlik ---");
console.log("- VAPID_PRIVATE_KEY asla frontend'e veya git'e eklenmez.");
console.log("- VAPID_PUBLIC_KEY frontend'e API üzerinden güvenle verilir.\n");
