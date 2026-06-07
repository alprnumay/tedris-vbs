/** Yerel dev portlarını (3000 web, 3001 api) dinleyen süreçleri sonlandırır. */
import { execSync } from "node:child_process";

const PORTS = [3000, 3001];

function pidsOnPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr LISTENING`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Port ${port}: PID ${pid} sonlandırıldı.`);
    } catch {
      console.warn(`Port ${port}: PID ${pid} sonlandırılamadı.`);
    }
  }
}
