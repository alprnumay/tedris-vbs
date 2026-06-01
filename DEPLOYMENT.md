# Nehari Veli Bilgilendirme — Vercel + Render dağıtımı

Monorepo yapısı korunur: frontend `artifacts/veli-bilgilendirme`, backend `artifacts/api-server`.

| Bileşen | Platform | URL örneği |
|---------|----------|------------|
| Frontend | Vercel | `https://<proje>.vercel.app` |
| API | Render Web Service | `https://<servis>.onrender.com` |
| Veritabanı | Neon (PostgreSQL) | `DATABASE_URL` |

---

## 1. Neon (veritabanı)

1. [Neon](https://neon.tech) üzerinde proje oluşturun.
2. **Connection string** (`postgresql://...?sslmode=require`) kopyalayın → Render’da `DATABASE_URL`.
3. Şema/migrasyon varsa deploy öncesi Neon’a uygulayın.

---

## 2. Render (API — `artifacts/api-server`)

**New → Web Service** → repo bağlayın, **Root Directory**: monorepo kökü (`.`).

| Ayar | Değer |
|------|--------|
| **Runtime** | Node |
| **Build Command** | `pnpm install && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/health` |

`render.yaml` kökte Blueprint olarak da kullanılabilir.

### Ortam değişkenleri (Render)

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `NODE_ENV` | Evet | `production` |
| `PORT` | Otomatik | Render atar; kod `PORT` bekler |
| `DATABASE_URL` | Evet | Neon bağlantı dizesi |
| `ADMIN_EMAIL` | Evet | Admin kullanıcı e-postası |
| `FRONTEND_URL` | Evet (prod) | Vercel canonical URL, örn. `https://tedris-vbs.vercel.app` (sonunda `/` yok) |
| `CORS_ORIGINS` | İsteğe bağlı | Ek Vercel preview domainleri, virgülle: `https://xxx.vercel.app,https://yyy.vercel.app` |
| `SMTP_USER` / `SMTP_PASS` | İsteğe bağlı | Destek e-postası (Brevo) |

Deploy sonrası API tabanı: `https://<servis>.onrender.com` — frontend env’de **`/api` soneki ile** kullanın.

---

## 3. Vercel (frontend — `artifacts/veli-bilgilendirme`)

**New Project** → aynı repo, **Root Directory**: monorepo kökü (`.`).

Kökteki `vercel.json` ayarları:

| Ayar | Değer |
|------|--------|
| **Install Command** | `pnpm install` |
| **Build Command** | `pnpm --filter @workspace/veli-bilgilendirme build` |
| **Output Directory** | `artifacts/veli-bilgilendirme/dist/public` |

> Vite çıktısı `dist/public` altındadır (`dist` değil). SPA yönlendirmesi `vercel.json` içindeki `rewrites` ile yapılır.

### Ortam değişkenleri (Vercel)

| Değişken | Örnek |
|----------|--------|
| `VITE_API_BASE_URL` | `https://<servis>.onrender.com/api` |

Build sırasında gömülür; Render URL’si hazır olduktan sonra Vercel’de tanımlayıp **Redeploy** edin.

---

## 4. CORS ve oturum çerezleri

### CORS (API)

- `credentials: true` korunur.
- İzin verilen origin’ler: `http://localhost:3000`, `http://127.0.0.1:3000`, `FRONTEND_URL`, `CORS_ORIGINS`.
- Geliştirmede `localhost` / `127.0.0.1` **herhangi bir port** (ör. `3000`, `5173`) kabul edilir.
- Üretimde yalnızca tanımlı origin’ler.

### Çerezler (cross-domain: Vercel ↔ Render)

| Ortam | `secure` | `sameSite` (oturum `sid`) |
|-------|----------|---------------------------|
| `NODE_ENV=production` | `true` | `none` |
| Geliştirme | `false` | `lax` |

Frontend `fetch` çağrılarında `credentials: "include"` kullanılmaya devam eder (`src/lib/api.ts`).

**Yerel geliştirme:** Frontend `pnpm dev` → `http://localhost:3000`. API için `artifacts/api-server/.env` içinde `PORT=5000` ve `NODE_ENV=development`. API’yi uzak Render URL’sine bağlıyorsanız (`VITE_API_BASE_URL`) çerezler uzak host’ta üretim kurallarıyla gelir; tam yerel API testi için `VITE_API_BASE_URL=http://localhost:5000/api` kullanın.

---

## 5. Doğrulama

1. Render: `GET https://<servis>.onrender.com/api/health` → `{ "ok": true }`
2. Vercel: uygulama açılır, giriş/kayıt çalışır.
3. Tarayıcı → Network: API istekleri Render’a gider, `Set-Cookie` / `Cookie` oturum için görünür.
4. Render’da `FRONTEND_URL` = Vercel production domain (https, slash yok).

---

## 6. Yerel komutlar (özet)

```bash
# Bağımlılıklar (kök)
pnpm install

# Frontend
pnpm --filter @workspace/veli-bilgilendirme dev

# API (PORT zorunlu)
cd artifacts/api-server
# .env: PORT=5000, DATABASE_URL=..., ADMIN_EMAIL=...
pnpm run build && pnpm run start
```

Kökten kısayol: `pnpm dev` → yalnızca Vite (port 3000).

---

## 7. Eski API’den geçiş

- Poster kaydı sunucuda **410** (devre dışı); afişler yalnızca tarayıcıda üretilir.
- `VITE_API_BASE_URL` değerini yeni VPS API adresiyle güncel tutun.

