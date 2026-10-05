# İKÜANTS TEKMER — Teslim Durumu

Son doğrulama: 2026-10-05, yerel ortam (gömülü PostgreSQL, Node.js, Next.js 16.1.1).

## 1. Doğrulama sonuçları

| Kontrol | Sonuç |
| --- | --- |
| `npx tsc --noEmit` | Hatasız |
| `npm run lint` | 0 hata, 428 uyarı (çoğu önceden var olan `any` / kullanılmayan değişken uyarıları) |
| `npm test` | 181 / 181 geçti |
| `next build` | Başarılı (332 rota) |
| `npx playwright test` | 132 / 132 geçti (tam çalıştırma, 2026-10-05) |
| Rota taraması | 26 public sayfa, 68 admin sidebar ekranı ve detay sayfaları (sekmeleriyle) konsol / API hatası olmadan açılıyor |
| Migration | `20261002000000` … `20261005100000_entrepreneur_program_label` (5 adet) yerelde `prisma migrate deploy` ile uygulandı. Production'a **uygulanmadı** — önce production veritabanı yedeği alınmalı. |

## 2. Modül durumu

| Alan | Durum |
| --- | --- |
| Form Merkezi (12 public form, versiyonlu yayın, KVKK, dosya, bot koruması) | READY |
| Başvuru Merkezi & kampanyalar (Program / TEKMER / Ideathon ayrımı, değerlendirme, kabul sonrası program ataması / alan tahsisi) | READY |
| CRM rehberi + 360° görünüm (kişi / kurum), derin bağlantılar | READY |
| Görevler & Kanban iş akışı (onay, iade, yetki kapsamı) | READY |
| Alanlar, rezervasyon, tahsis, 3D/360° deneyim altyapısı | READY (3D varlıkları yüklenmedi; gerçek model / panorama gerekir) |
| E-Posta Merkezi (oluştur, taslak, zamanla, outbox, şablonlar, gerçek veriden değişken) | READY — gönderim için SMTP gerekli |
| Rapor Merkezi + otomatik günlük/aylık/yıllık raporlar, onay/yayın, sürümleme | READY — otomatik çalışma için zamanlayıcı gerekli |
| AI Komuta Merkezi (kayıtlı işlemler, önizleme, onay, denetim, geri alma) | READY — dil modeli opsiyonel |
| Dashboard (rol bazlı, canlı veri), Takvim, Ctrl+K arama, Bildirimler, Doküman Merkezi | READY |
| Sistem Sağlığı (gerçek yapılandırma durumu) | READY |
| Program afiş/banner/galeri + renk teması, Başvur/Bilgi Al | READY |
| Kullanım alanları fotoğrafları ve kategorili liste | READY (fotoğraflar yüklenmedi; gerçek çekim gerekir) |
| Ana sayfa tasarım stüdyosu (tema + bölümler, taslak/önizleme/yayın/sürüm) | READY |
| Form yerleşimleri (program sayfası, destekler, alanlar, bağımsız sayfa, ana sayfa bloğu) | READY |
| Destekler: örnek senaryolar, iletişim formuna ön dolu bilgi talebi | READY |
| Bildirim garantisi: başvuru / iletişim / form / rezervasyon / teklif olaylarında tüm Süper Yöneticilere ve yetkili adminlere e-posta + uygulama içi bildirim; kurallar panelden | READY — gönderim için SMTP gerekli |
| Roller & kişiye özel yetki matrisi, personel fotoğrafı, çalışma türü, SGK durumu (tanım), Ar-Ge personeli | READY |
| Ekipler, alt görevler, izleyiciler, tekrarlayan görevler, şablonlar, otomasyon kuralları, İş Planlama (takvim / Gantt / ekip yükü) | READY |
| Makine parkı (lazer kesim, SMT dizgi, 3D baskı) + tarife + fiyat teklifi formu | READY (lazer makinelerinin teknik ölçüleri girilmedi; kaynak bulunamadı) |
| Ön muhasebe: cariler, kasa / banka, satış faturası (KDV, tevkifat, GİB numarası), tahsilat, ödeme, virman, ekstre, KDV özeti, yazdırma | READY — e-Fatura gönderimi entegratör bağlantısı gerektirir |
| Entegrasyon Merkezi: bağlantılar (KOSGEB, TÜBİTAK, e-Fatura, muhasebe, banka, SMS, Slack, Teams…), imzalı webhook'lar, API anahtarları, `/api/v1` | READY — gerçek bağlantı için kurumların API bilgileri gerekli |
| Girişimci program ataması: TEKMER Yer Edinme, ANTSPARK, ANTSFire, diğer programlar ve serbest metinli "Diğer" | READY |
| Form gönderim kutlaması (roket / konfeti / onay) ve site hareket seviyesi, admin panelinden | READY |
| Güvenlik: sunucu tarafı RBAC, T.C. şifreleme/maskeleme, denetim kaydı, özel dosya erişimi, CSV enjeksiyon koruması | READY |

## 3. Dış yapılandırma bekleyenler (PENDING_EXTERNAL_CONFIGURATION)

| Bileşen | Gerekli | Olmadan davranış |
| --- | --- | --- |
| Production veritabanı | `DATABASE_URL` + `npx prisma migrate deploy` | — |
| Kimlik şifreleme | `IDENTITY_ENCRYPTION_KEY` (production'da zorunlu) | Production'da kişi kaydı / T.C. görüntüleme hata verir |
| Entegrasyon sırları | `INTEGRATION_ENCRYPTION_KEY` (production'da zorunlu) | Entegrasyon bağlantısı / webhook kaydı hata verir |
| e-Fatura | Entegrasyon Merkezi'nde e-Fatura entegratörü bağlantısı | Kesilen faturalar "Entegratör bekleniyor" durumunda kalır |
| Kurum API'leri (KOSGEB, TÜBİTAK vb.) | Kurumların vereceği servis adresi ve anahtar | Bağlantı kartları "Eksik bilgi" durumunda bekler |
| E-posta | `SMTP_*`, `ADMIN_NOTIFICATION_EMAIL` | E-postalar outbox'ta `PENDING` bekler; "gönderildi" denmez |
| Nesne depolama | `STORAGE_PROVIDER=s3`, `S3_*`, `STORAGE_BUCKET_*` | Yerel disk (sunucusuz ortamda kalıcı değil) |
| Zamanlayıcı | `CRON_SECRET` + cron tanımı | Zamanlanmış e-posta, haber, otomatik rapor elle tetiklenir |
| AI dil modeli | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | Yalnızca tanımlı Türkçe komutlar |
| 3D / 360° içerik | Gerçek GLB/panorama dosyaları | Alanlarda 3D düğmesi görünmez |
| Microsoft 365, Meta/Instagram | İlgili anahtarlar | Entegrasyonlar pasif |

## 4. Bilinmesi gerekenler

- Production'da dosyalar için `STORAGE_PROVIDER=s3` zorunludur; Vercel'de yerel disk kalıcı değildir (yüklenen logo, fotoğraf ve belgeler kaybolur).
- Rate limit sunucu belleğinde tutulur (`lib/rate-limit.ts`); birden çok sunucusuz örnekte sınırlar örnek başına uygulanır. Yüksek trafikte paylaşımlı bir depoya (Redis / veritabanı) taşınmalı.
- Hata izleme servisi (ör. Sentry) kurulu değil.
- Next.js 16 kuralı gereği `middleware.ts` → `proxy.ts` olarak yeniden adlandırıldı (davranış aynı).

- T.C. kimlik numarasını görmek için Süper Yönetici dahil herkese **açık** `persons:identity_view` izni verilmelidir (bilinçli tasarım).
- Yüksek riskli AI işlemleri için `ai:high_risk_action` izni gerekir.
- Kira ödemeleri gibi finansal işlemler AI ile geri alınamaz; Finans ekranından düzeltilir.
- Kapasitesi doğrulanmış alanlar: Açık Toplantı Masası 1 (8), Açık Toplantı Masası 2 (8), Açık Toplantı Masası — 20 Kişilik (20). Diğer alanların kapasitesi "Bilgi girilmemiş" olarak bırakıldı.
- `/admin/eposta-sablonlari` artık E-Posta Merkezi → Şablonlar sekmesine yönlendirir.

## 5. Dokümanlar

[README.md](README.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · [ADMIN_GUIDE.md](ADMIN_GUIDE.md) ·
[docs/AI_SETUP.md](docs/AI_SETUP.md) · [docs/FORM_CENTER_GUIDE.md](docs/FORM_CENTER_GUIDE.md) · [docs/3D_ASSET_GUIDE.md](docs/3D_ASSET_GUIDE.md) · [.env.example](.env.example)
