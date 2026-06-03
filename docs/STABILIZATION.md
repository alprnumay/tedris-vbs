# Tedris VBS — Stabilizasyon ve canlı onarım prosedürü

## Özet

- Frontend onarım döngüsü **kapalı** (`VITE_ENABLE_REPAIR` unset veya `false`).
- Onarım yalnızca **`POST /api/admin/repair-app-user-auth-links`** (Vercel Function veya api-server).
- **İlk test her zaman dry-run:** `?dryRun=true` — kayıt/auth yazılmaz.
- **Gerçek onarım öncesi** VPS/PostgreSQL tam yedeği zorunlu.

---

## Vercel projesi ve ortam değişkenleri

**Proje:** Monorepo kökündeki Vercel projesi (frontend deploy — `vercel.json` → `artifacts/veli-bilgilendirme`).

Vercel Dashboard → **Projeniz (tedris-vbs / veli-bilgilendirme)** → **Settings** → **Environment Variables** → **Production** (ve Preview isteğe bağlı):

| Değişken | Değer | Not |
|----------|--------|-----|
| `VPS_API_BASE_URL` | `https://api.antalyanehari.xyz/api` | Sunucu onarımı VPS’e bağlanır |
| `VPS_PROJECT_API_KEY` | `<proje_anahtarı>` | VPS `X-Project-Key` |
| `ADMIN_EMAIL` | `alprn0604@gmail.com` | Admin yetki kontrolü |

**Frontend (şimdilik):**

| Değişken | Değer |
|----------|--------|
| `VITE_API_BASE_URL` | `https://api.antalyanehari.xyz/api` |
| `VITE_PROJECT_API_KEY` | `<proje_anahtarı>` |
| `VITE_ENABLE_REPAIR` | **tanımlamayın** veya `false` |

Onarım açılacağı zaman: `VITE_ENABLE_REPAIR=true` (dry-run testleri bittikten sonra).

---

## Endpoint URL

Vercel production domain’iniz ne ise (örnek):

```
https://<VERCEL_PRODUCTION_DOMAIN>/api/admin/repair-app-user-auth-links
```

Dry-run:

```
POST https://<VERCEL_PRODUCTION_DOMAIN>/api/admin/repair-app-user-auth-links?dryRun=true
```

**Not:** `api.antalyanehari.xyz` üzerinde bu route yoktur (VPS kodu repoda değil). Onarım **Vercel origin** üzerinden çalışır.

---

## Dry-run raporu

```json
{
  "ok": true,
  "dryRun": true,
  "totalAppUsers": 0,
  "uniqueEmails": 0,
  "alreadyLinked": 0,
  "emailNormalized": 0,
  "emailNormalizedWouldUpdate": 0,
  "authFoundAndLinked": 0,
  "authFoundWouldLink": 0,
  "authCreatedAndLinked": 0,
  "authWouldCreate": 0,
  "duplicatesDetected": 0,
  "skippedDeleted": 0,
  "failed": 0,
  "errors": []
}
```

Gerçek onarım: `dryRun=false` veya query/body’de `dryRun` yok (varsayılan frontend çağrısı `dryRun=true` kalır güvenlik için).

---

## Canlı test sırası (A → H)

| Adım | İşlem |
|------|--------|
| **A** | Git push → Vercel deploy bitene kadar bekle |
| **B** | Vercel env: `VPS_API_BASE_URL`, `VPS_PROJECT_API_KEY`, `ADMIN_EMAIL` |
| **C** | Admin olarak giriş → JWT al → dry-run POST (curl veya Postman) |
| **D** | Raporu incele (`authWouldCreate`, `authFoundWouldLink`, `duplicatesDetected`, `failed`) |
| **E** | Rapor mantıklıysa **VPS/PostgreSQL yedeği** |
| **F** | `VITE_ENABLE_REPAIR=true` + redeploy (henüz yapmayın) |
| **G** | Veri Sağlığı → tek repair (`dryRun=false` ile bilinçli çağrı) |
| **H** | `burdurbaglarbasi@gmail.com` ile login + raporlar |

---

## curl örneği (dry-run)

```bash
curl -X POST "https://<DOMAIN>/api/admin/repair-app-user-auth-links?dryRun=true" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "X-Project-Key: <PROJECT_KEY>" \
  -H "Content-Type: application/json" \
  -d "{}"
```

---

## Login’de olmaması gerekenler

- `POST /api/auth/register` (login akışında)
- `PUT /api/admin/records/:id` (login akışında)
- Toplu frontend repair / `adminReconcile`
