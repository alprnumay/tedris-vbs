# Tedris VBS — Acil stabilizasyon ve backend onarım

## Durum

Frontend üzerinden yapılan `auth/register` + `admin/records` döngüsü veri bütünlüğünü bozdu (852 `app_user`, 403/409 fırtınası). Onarım artık **yalnızca backend** endpoint üzerinden yapılmalı.

## Frontend (şu an)

- Veri Sağlığı onarım butonları **kapalı** (`VITE_ENABLE_REPAIR` varsayılan: kapalı).
- Login: yalnızca `/auth/login` + `app_user` okuma + aktiflik; repair/register/admin PUT yok.
- Onarım açıldığında: `VITE_ENABLE_REPAIR=true` ve tek çağrı `POST .../admin/repair-app-user-auth-links`.

## Backend onarım endpoint

| Konum | Dosya |
|--------|--------|
| Ortak mantık | `lib/tedris-repair/repairAppUserAuthLinks.ts` |
| Vercel (önerilen) | `api/admin/repair-app-user-auth-links.ts` |
| api-server (Render) | `artifacts/api-server/src/routes/vpsRepair.ts` |

### Ortam değişkenleri (sunucu)

| Değişken | Açıklama |
|----------|----------|
| `VPS_API_BASE_URL` | `https://api.antalyanehari.xyz/api` |
| `VPS_PROJECT_API_KEY` | Proje anahtarı |
| `ADMIN_EMAIL` | Admin e-posta (yetki kontrolü) |

### Vercel deploy

1. Vercel env: `VPS_API_BASE_URL`, `VPS_PROJECT_API_KEY`, `ADMIN_EMAIL`
2. Frontend env: `VITE_ENABLE_REPAIR=true`, `VITE_REPAIR_API_BASE_URL` = Vercel site kökü (örn. `https://xxx.vercel.app/api` değil — fonksiyon `/api/admin/...` altında; `repairApiUrl()` origin + `/api/...` kullanır)

### VPS’e gömme

`lib/tedris-repair/*` modülünü VPS API koduna kopyalayıp `POST /admin/repair-app-user-auth-links` olarak mount edin (frontend `VITE_API_BASE_URL` aynı kalır).

## Onarımı tekrar açma

```env
VITE_ENABLE_REPAIR=true
# İsteğe bağlı: onarım Vercel function’da ise boş bırakın (same-origin /api kullanılır)
# VITE_REPAIR_API_BASE_URL=https://your-app.vercel.app
```

VPS’te endpoint yoksa önce Vercel function veya api-server route deploy edilmelidir.
