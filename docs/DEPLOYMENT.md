# İKÜANTS TEKMER — Kurulum ve Yayına Alma

> **Politika:** Production'a dağıtım, uzak veritabanı migration'ı veya DNS değişikliği yalnızca
> açık yazılı onayla ("CANLIYA AL") yapılır.

## 1. Gereksinimler

- Node.js 20+ ve npm
- PostgreSQL 15+ (Neon, Supabase, RDS veya kurum içi)
- Production için S3 uyumlu nesne depolama (AWS S3, Cloudflare R2, MinIO). Sunucusuz ortamlarda yerel disk kalıcı değildir.
- SMTP sağlayıcısı (Microsoft 365, SES, SendGrid, Resend vb.)
- Zamanlayıcı (Vercel Cron, GitHub Actions, sistem cron) — opsiyonel ama önerilir

## 2. Ortam değişkenleri

Tam liste ve açıklamalar: [`.env.example`](../.env.example).

| Değişken | Zorunlu | Not |
| --- | --- | --- |
| `DATABASE_URL` | Evet | PostgreSQL bağlantısı |
| `AUTH_SECRET` (veya `JWT_SECRET`) | Evet | Oturum imzası, ≥32 karakter |
| `IDENTITY_ENCRYPTION_KEY` | Evet (production) | T.C. kimlik şifreleme. **Kurulumdan sonra değiştirmeyin.** |
| `INTEGRATION_ENCRYPTION_KEY` | Evet (production) | Entegrasyon Merkezi'ne girilen API anahtarı / parola / webhook sırlarını şifreler. Değişirse kayıtlı sırlar yeniden girilmelidir |
| `INTERNAL_SCHEDULER` | Hayır | Boş: sürekli çalışan production sunucusunda arka plan işleri 5 dakikada bir uygulama içinden çalışır. `off` kapatır, `on` geliştirmede de açar |
| `NEXT_PUBLIC_APP_URL` | Evet | E-posta bağlantıları için dış adres |
| `SMTP_*`, `ADMIN_NOTIFICATION_EMAIL` | Hayır | Yoksa e-postalar outbox'ta `PENDING` bekler |
| `STORAGE_PROVIDER=s3`, `S3_*`, `STORAGE_BUCKET_*`, `STORAGE_PUBLIC_BASE_URL` | Production'da önerilir | Yoksa yerel disk kullanılır; sunucusuz ortamda kalıcı değildir (Sistem Sağlığı uyarır). `STORAGE_PROVIDER=s3` seçilip `S3_*` eksikse yükleme 503 döner |
| `CRON_SECRET` | Hayır | Yoksa zamanlanmış işler yalnızca elle tetiklenir |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`, `AI_MODEL` | Hayır | Yoksa AI tanımlı Türkçe komutlarla çalışır |

Gizli anahtar üretimi: `openssl rand -base64 48`

## 3. Veritabanı migration'ları

Migration dosyaları `prisma/migrations` altındadır:

- `20261001000000_init_schema` — başlangıç şeması
- `20261002000000_admin_platform_completion` — Form Merkezi, kampanyalar, rezervasyon/tahsis, 3D deneyim,
  doküman, bildirim okuma, e-posta zamanlama, otomatik raporlar. **Yıkıcı değildir:** tablo/kolon ekler,
  bazı NOT NULL kısıtlarını gevşetir, finansal kayıtlarda silme kuralını CASCADE → RESTRICT yapar.
- `20261003000000_program_theme_space_photos_form_placements` — program afişi ve renk teması, alan fotoğrafları
  (kapak + galeri), form yerleşimleri (FormPlacement). Yalnızca ekleme yapar.
- `20261003100000_work_tracking` — iş paslama (`TaskHandoff`), süre kayıtları (`TaskTimeEntry`), yapılacaklara
  kontrol listesi / tekrar / tahmini süre / etiket kolonları. Yalnızca ekleme yapar.

- `20261004090000_erp_work_os_integrations_finance` — ekipler (`WorkTeam`, `WorkTeamMember`), görev izleyicileri,
  alt görev / tekrar / ekip kolonları, görev şablonları, entegrasyon bağlantıları ve kayıtları, webhook abonelikleri,
  API anahtarları, ön muhasebe tabloları (`FinanceParty`, `FinanceAccount`, `SalesInvoice`, `SalesInvoiceLine`,
  `FinanceMovement`), personel İK kolonları (çalışma türü, SGK durumu, işe başlama, Ar-Ge personeli).
  Yalnızca ekleme yapar; mevcut `AutomationRule` tablosu otomasyon kuralları için kullanılır.

Yeni izinler (`teams:view|manage`, `automations:manage`, `integrations:view|manage`) `npm run bootstrap:prod`
sırasında ekleyici olarak senkronize edilir. Makine parkı kayıtları ve "Makine Kullanımı Fiyat Teklifi Talebi"
formu da aynı komutla **yalnızca yoksa** oluşturulur (mevcut alan ve formlara dokunulmaz).

Sayfa düzenleri (Tasarım Stüdyosu) ve site ayarları tablo gerektirmez; `SiteSetting` içinde saklanır
(`homepage_layout*`, `page_layout*:<sayfa>`, `cookie_*`, `footer_*`). Kayıt yoksa sayfalar orijinal tasarımla açılır.

Veri onarımı (bir kez, önce kuru çalıştırma): destek kartlarındaki kaybolan "Örnek Senaryo" metinlerini sitenin
orijinal metinlerinden doldurur; yalnızca boş alanları doldurur, düzenlenmiş metne dokunmaz:

```bash
npx tsx scripts/restore-support-examples.ts          # ne yapılacağını gösterir
npx tsx scripts/restore-support-examples.ts --apply  # uygular
```

Program fotoğrafları düzeltmesi (bir kez, önce kuru çalıştırma): ANTSFire kaydında duran ANTSPARK fotoğraflarını
ANTSPARK'a taşır, ANTSFire'ın afiş/galeri alanlarını boşaltır (gerçek ANTSFire görselleri yüklenene kadar renk
teması görünür). Değişiklik denetim kaydına yazılır:

```bash
npx tsx scripts/fix-program-photos.ts          # ne yapılacağını gösterir
npx tsx scripts/fix-program-photos.ts --apply  # uygular
```

`scripts/cleanup-interaction-test-leftovers.ts` yalnızca geliştirme veritabanı içindir: eski e2e çalıştırmalarının
bıraktığı test görevlerini / faaliyetlerini birebir test kalıbıyla eşleştirip siler. Production'da çalıştırmayın.

Production'da **yalnızca**:

```bash
npx prisma migrate deploy
```

Yasaklar: production'da `prisma db push`, `migrate reset`, tablo silme, migration'ı uygulamadan
`migrate resolve --applied` ile "uygulandı" işaretlemek.

Mevcut bir production veritabanı daha önce `db push` ile kurulduysa önce yedek alın, ardından
`npx prisma migrate diff --from-url "$DATABASE_URL" --to-migrations prisma/migrations --shadow-database-url <boş-db>`
ile farkı inceleyin; fark yoksa yalnızca o durumda `migrate resolve --applied` kullanılabilir.

## 4. İlk kurulum

```bash
npm ci
npx prisma migrate deploy
BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... npm run bootstrap:prod
npm run build && npm start
```

`bootstrap:prod`: izin/rol tanımlarını senkronize eder (ekleyici), ilk Super Admin'i oluşturur, Form Merkezi
formlarını/kampanyalarını, doğrulanmış 9 alanı ve iletişim e-posta şablonlarını **yalnızca yoksa** oluşturur.
`--dry-run` ile önce kontrol edilebilir.

## 5. Zamanlayıcı

`GET /api/cron/process-jobs` — `Authorization: Bearer <CRON_SECRET>` başlığı zorunludur.
Yapılanlar: zamanlanmış haber yayını, süresi dolmuş oturum temizliği, e-posta kuyruğu,
geciken görev otomasyonları (her görev bir kez), otomatik kurumsal raporlar (son 7 gün / 3 ay / 1 yıl için eksikleri
tamamlar; tekrar çalıştırmak çoğaltmaz).

**Sürekli çalışan sunucu** (`npm start`, Docker, VM): aynı işler `instrumentation.ts` ile uygulama içinden 5 dakikada
bir çalışır; harici cron gerekmez. Sunucusuz barındırmada (Vercel vb.) arka plan süreci kalıcı olmadığından cron
uç noktası kullanılmalıdır. İşler idempotenttir; ikisinin birlikte çalışması sorun yaratmaz.
SMTP tanımlıysa e-postalar ayrıca oluşturuldukları anda gönderilmeye çalışılır.

Örnek (sistem cron, 15 dakikada bir):

```
*/15 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://ALAN-ADI/api/cron/process-jobs
```

Vercel Cron kullanılacaksa `vercel.json` içine `crons` tanımı eklenmeli ve `CRON_SECRET` ortam değişkeni
tanımlanmalıdır (Vercel bu değeri Bearer olarak gönderir). Planınızın cron sıklığı sınırını kontrol edin.

## 6. Yayın öncesi kontrol listesi

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`
- [ ] `npx playwright test` (yerel/staging veritabanında)
- [ ] Ortam değişkenleri production gizli anahtar yöneticisinde tanımlı
- [ ] Veritabanı yedeği alındı
- [ ] `npx prisma migrate deploy`
- [ ] `/admin/sistem-sagligi` ekranında veritabanı, depolama, güvenlik "Çalışıyor"
- [ ] Test e-postası (E-Posta Merkezi → Şablonlar → Test gönder)
- [ ] Bir public formdan test gönderimi ve admin tarafında görünürlüğü (QA işaretli, sonra kimlikle silinir)
