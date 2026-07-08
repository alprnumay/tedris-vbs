# Tedris VBS Load Test

Bu klasör Tedris VBS canlı kullanıma açılmadan önce API, veritabanı, upload ve tarayıcı export akışlarını ölçmek için hazırlanmıştır.

## Araçlar

- API ve eşzamanlı kullanıcı yükü: `k6`
- Otomatik Markdown raporu: `scripts/load-test/run-load-test.mjs`
- Tarayıcı içi PNG / WhatsApp export ölçümü: `Playwright`

`pnpm qa` veya `pnpm test:load` önce k6 API yük testini, ardından Playwright gerçek tarayıcı testlerini çalıştırır ve `load-tests/results` altında tek Markdown raporu üretir. Sistemde k6 yoksa Docker açıksa `grafana/k6:latest` imajı kullanılır.

## Hızlı Kullanım

Yerel geliştirme:

```powershell
pnpm dev
pnpm qa
```

Production veya staging hedefi:

```powershell
$env:API_BASE="https://www.nehariplatform.com.tr/api"
$env:FRONTEND_BASE="https://www.nehariplatform.com.tr"
$env:LOAD_TEST_USERS="100"
$env:LOAD_TEST_ADMIN_EMAIL="admin@example.com"
$env:LOAD_TEST_ADMIN_PASSWORD="********"
pnpm qa
```

Hazır API yük profilleri:

```powershell
pnpm load-test:50
pnpm load-test:100
pnpm load-test:250
pnpm load-test:500
```

Yalnız API:

```powershell
pnpm load-test:api
```

Yalnız gerçek tarayıcı:

```powershell
pnpm load-test:browser-only
```

## Varsayılan Senaryolar

- 100 kullanıcı giriş yapar.
- 100 kullanıcı `/auth/me` ile token/session doğrular.
- 100 kullanıcı ana sayfayı açar.
- 100 kullanıcı `poster_draft` oluşturarak veli bilgilendirme üretimini simüle eder.
- 100 kullanıcı önizleme açma activity/usage akışını çalıştırır.
- 100 kullanıcı PNG export activity akışını çalıştırır.
- 50 kullanıcı WhatsApp paylaşım activity akışını çalıştırır.
- 50 kullanıcı rapor ekranı endpoint'lerini çağırır.
- 100 kullanıcı yoklama kaydı oluşturur.
- 100 kullanıcı yurt ödev takibi kaydı oluşturur.
- 50 kullanıcı aynı anda öğrenci ekler.
- 50 kullanıcı aynı anda rapor alır.
- 20 kullanıcı aynı anda fotoğraf yükler.

Ek olarak profil, kurum, push ayarları, showcase, destek, sağlık kontrolleri ve genel activity endpoint'leri de test edilir.

## Gerçek Tarayıcı Testi

Playwright gerçek kullanıcı davranışını simüle eder:

- 20 kullanıcı giriş yapar.
- Veli bilgilendirme formunu doldurur.
- Önizleme / afiş akışına geçer.
- PNG indir butonunu çalıştırır.
- WhatsApp paylaşımını başlatır (`navigator.share` test sırasında mock edilir).
- Okul takip ekranına gider.
- Yoklama, yurt ödev takibi ve karne ekranlarına ulaşmaya çalışır.
- API üzerinden öğrenci/yoklama/rapor etkileşimlerini de tetikler.

Toplanan browser metrikleri:

- Browser memory / JS heap
- CDP task/script duration
- Sayfa açılış süresi
- İlk render / first paint / FCP
- PNG üretim süresi
- Login süresi
- Console error/warning
- Network error
- Page error
- Unhandled Promise / React error sinyalleri

## Önemli Notlar

PNG oluşturma ve WhatsApp paylaşımı gerçek dosya üretimini tarayıcıda yapar; sunucuda PNG üretim endpoint'i yoktur. Bu nedenle k6 testi bu iki akışın backend etkisini, yani activity/usage kayıtlarını ölçer.

Gerçek `html2canvas` süresini, tarayıcı CPU etkisini ve WhatsApp buton tepkisini ayrıca sadece browser katmanında ölçmek için:

```powershell
$env:FRONTEND_BASE="https://www.nehariplatform.com.tr"
$env:API_BASE="https://www.nehariplatform.com.tr/api"
$env:LOAD_TEST_BROWSER_EMAIL="test@example.com"
$env:LOAD_TEST_BROWSER_PASSWORD="********"
$env:LOAD_TEST_BROWSER_USERS="10"
pnpm load-test:browser
```

100 gerçek tarayıcı aynı anda çalıştırmak yerel bilgisayarı zorlayabilir. Bunun için ayrı bir test makinesi veya CI runner önerilir.

## Ortam Değişkenleri

- `API_BASE`: API kökü. Varsayılan `http://localhost:3001/api`.
- `FRONTEND_BASE`: Web arayüzü. Varsayılan `http://localhost:3000`.
- `LOAD_TEST_USERS`: Ana senaryo kullanıcı sayısı. Varsayılan `100`.
- `LOAD_TEST_HALF_USERS`: 50'lik senaryolar için kullanıcı sayısı. Varsayılan `LOAD_TEST_USERS / 2`.
- `LOAD_TEST_UPLOAD_USERS`: Upload senaryosu kullanıcı sayısı. Varsayılan `LOAD_TEST_USERS / 5`.
- `LOAD_TEST_PASSWORD`: Otomatik oluşturulan test kullanıcı şifresi. Varsayılan `LoadTest123!`.
- `LOAD_TEST_EMAIL_PREFIX`: Test kullanıcı e-posta prefix'i. Varsayılan `loadtest`.
- `LOAD_TEST_EMAIL_DOMAIN`: Test kullanıcı e-posta domain'i. Varsayılan `example.test`.
- `LOAD_TEST_ADMIN_EMAIL`: Admin hesabı. Rapor ve kurum eşleşmeli okul takip senaryoları için önerilir.
- `LOAD_TEST_ADMIN_PASSWORD`: Admin şifresi.
- `LOAD_TEST_DISTRICT`: Test kurumu mıntıka adı. Varsayılan `Alanya`.
- `LOAD_TEST_INSTITUTION_NAME`: Test yurdu/kurumu. Varsayılan `Tedris Load Test Yurdu`.
- `DATABASE_URL`: Verilirse rapora PostgreSQL istatistikleri ve lock durumu eklenir.
- `LOAD_TEST_BROWSER`: `1` yapılırsa `pnpm load-test` sonunda Playwright export testi de çalıştırılır.
- `LOAD_TEST_BROWSER_USERS`: Playwright eşzamanlı kullanıcı sayısı. Varsayılan `20`.
- `LOAD_TEST_PROFILE`: k6 profil değeri: `50`, `100`, `250`, `500`.

## Rapor

Her çalıştırmada `load-tests/results` altında iki dosya üretilir:

- `k6-summary-<run-id>.json`
- `browser-metrics-<run-id>.jsonl`
- `playwright-browser-summary.json`
- `load-test-report-<run-id>.md`

Markdown raporda şu başlıklar bulunur:

- Toplam sanal kullanıcı
- Başarılı / başarısız istek oranı
- Ortalama, p95 ve maksimum yanıt süresi
- En yavaş endpoint
- Timeout, 500, 404, 401, 403 sayıları
- Endpoint bazlı performans
- Docker anlık CPU/RAM kullanımı
- PostgreSQL kullanım ve lock durumu
- Bottleneck ve hata analizi
- En yavaş sayfa/akış
- PNG ortalama üretim süresi
- Login ortalaması
- Browser memory / CPU task ölçümleri
- Console, network, unhandled promise ve page error sayıları

## Test Verisini Temizleme

Test kullanıcıları, test kayıtları ve test upload dosyaları run-id veya e-posta prefix'i ile temizlenebilir.

```powershell
$env:DATABASE_URL="postgresql://..."
$env:LOAD_TEST_RUN_ID="2026-..."
pnpm load-test:cleanup
```

Önce kaç kayıt silineceğini görmek için:

```powershell
pnpm load-test:cleanup -- --dry-run
```

## Güvenli Çalıştırma

Bu test kullanıcı, öğrenci, yoklama, poster taslağı, activity ve upload kayıtları oluşturur. Production üzerinde çalıştırmadan önce mümkünse staging veritabanı kullanın. Production üzerinde çalıştırılacaksa `LOAD_TEST_EMAIL_PREFIX`, `LOAD_TEST_RUN_ID` ve `LOAD_TEST_ADMIN_EMAIL/PASSWORD` değerlerini özellikle ayarlayın; temizlik komutu bu işaretlerle çalışır.
