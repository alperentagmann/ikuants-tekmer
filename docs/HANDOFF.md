# İKÜANTS TEKMER — DIGITAL OPERATIONS PLATFORM (v1.0.0)
## PRODUCTION RELEASE & HANDOFF DOKÜMANI

---

### 1. Ürün Özeti
**İKÜANTS TEKMER Digital Operations Platform**, İstanbul Kültür Üniversitesi AR-GE ve Yenilikçilik Merkezi (TEKMER) bünyesindeki kuluçka, girişimcilik, kamu fonları ve proje yönetimi, ofis/kira tahsilat operasyonları ile kurumsal web sitesi içerik yönetimini uçtan uca dijitalleştiren kurumsal işletim sistemidir.

- **Canlı Public Web Sitesi**: [https://www.ikuantstekmer.com/](https://www.ikuantstekmer.com/)
- **Canlı Yönetim Paneli (Admin)**: [https://www.ikuantstekmer.com/admin](https://www.ikuantstekmer.com/admin)
- **Sürüm**: `v1.0.0 (Production Stable)`
- **Mimari**: Next.js 16 (App Router) · React 19 · TypeScript · Prisma ORM · PostgreSQL · Tailwind CSS · Playwright E2E

---

### 2. Modüller ve Fonksiyonel Kapsam

#### 2.1. Finans & Bütçe Yönetim Merkezi (`/admin/finans`, `/admin/raporlar/finans`)
- **Proje Finans Defteri**: Bütçe vs Harcanan, Gelen Finansman vs Beklenen Finansman, Nakit Durumu, Taahhüt ve Fiili Harcamalar.
- **Çoklu Para Birimi (Multi-Currency)**: TRY, USD, EUR, GBP tutarları ayrı ayrı tutulur; TCMB/manuel kur tablosu ile baz para birimi eşdeğeri izlenir.
- **Fatura Defteri (`/admin/finans/faturalar`)**: Tedarikçi, fatura numarası, KDV, net/brüt tutar, proje ilişkisi ve belge durumu.
- **Alacaklar Merkezi (`/admin/finans/alacaklar`)**: Kira harici kurumsal alacaklar (`RENT`, `PROJECT_PAYMENT`, `SERVICE_FEE`, `SPONSORSHIP`, `EVENT`, `OTHER`), kısmi tahsilat ve bakiye takibi.

#### 2.2. Girişimci Kira & Tahsilat Modülü (`/admin/finans/kiralar`, `/admin/raporlar/kira`)
- **Girişimci Sözleşme İlişkisi**: Her kira sözleşmesi (`RentContract`) doğrudan `Entrepreneur` profiline bağlıdır.
- **Aylık Otomatik Tahakkuk (`RentAccrual`)**: Net kira + KDV üzerinden her ay otomatik tahakkuk oluşur.
- **Kısmi Ödeme & Bakiye Takibi (`RentPayment`)**: Kısmi ödeme yapıldığında bakiye otomatik güncellenir (`ÖDENDİ`, `KISMİ ÖDENDİ`, `GECİKMİŞ`, `ÖDEME BEKLENİYOR`, `MUAF`).
- **6 Segmentli Borç Yaşlandırma Matrisi**: `Vadesi Gelmemiş`, `1–7 Gün`, `8–30 Gün`, `31–60 Gün`, `61–90 Gün`, `90+ Gün`.
- **Girişimci Kira Ekstresi (`/admin/girisimciler/[id]/finans-kira`)**: Sözleşme, tahakkuk ve ödemelerin kronolojik yürüyen bakiyeli ekstresi.

#### 2.3. Girişimci & Kuluçka CRM (`/admin/girisimciler`, `/admin/programlar`, `/admin/basvurular`)
- Çoklu program ataması, durum geçmişi, kurucu ve ekip bilgileri, patent/hibe kayıtları.
- Başvuru değerlendirme boru hattı ve puanlama.

#### 2.4. Operasyon & Günlük Etkileşimler (`/admin/benim-gunum`, `/admin/gorevler`, `/admin/faaliyetler`)
- Günlük ziyaretçi/girişimci görüşme logları (`DailyInteraction`).
- Tek tıkla Göreve (`Task`) veya Kurumsal Faaliyete (`CorporateActivity`) dönüştürme.

#### 2.5. KVKK & Açık Rıza Yönetimi (`/admin/kvkk`)
- Aydınlatma metinleri, açık rıza onayları, PII maskeleme ve geri çekme denetim izleri.

#### 2.6. Kurumsal CMS & Studios (`/admin/anasayfa`, `/admin/haberler`, `/admin/medya`)
- 23 slide'lı dinamik Hero Slider, Kurullar, Ekip, Hizmetler, Kullanım Alanları, Mevzuat, SSS ve Partnerler.

#### 2.7. Güvenlik, Denetim & Export
- Tüm tablolarda Excel ve CSV dışa aktarımı (`CSV Formula Injection` korumalı).
- Her işlem için `AuditLog` kaydı.
- İki Adımlı Doğrulama (TOTP MFA), Rol Tabanlı Yetkilendirme (RBAC).

---

### 3. Çevre Değişkenleri (Environment Variables)

| Kategori | Değişken Adı | Durum | Açıklama |
| :--- | :--- | :--- | :--- |
| **DATABASE** | `DATABASE_URL` | **REQUIRED** | PostgreSQL veritabanı bağlantı adresi |
| **AUTH** | `JWT_SECRET` | **REQUIRED** | Oturum token imzalama anahtarı |
| **AUTH** | `ADMIN_SESSION_COOKIE_NAME` | **OPTIONAL** | Oturum çerez adı (`__session`) |
| **APPLICATION** | `NEXT_PUBLIC_APP_URL` | **REQUIRED** | Uygulama ana URL adresi |
| **STORAGE** | `STORAGE_PROVIDER` | **OPTIONAL** | `local`, `s3`, `supabase` |
| **STORAGE** | `STORAGE_BUCKET_PUBLIC` | **OPTIONAL** | Public medya bucket adı |
| **STORAGE** | `STORAGE_BUCKET_PRIVATE` | **OPTIONAL** | Hassas sözleşme bucket adı |
| **EMAIL** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | **OPTIONAL** | Gerçek SMTP sağlayıcısı (Yoksa Simulation Outbox çalışır) |
| **INTEGRATION**| `MS_GRAPH_CLIENT_ID`, `META_ACCESS_TOKEN` | **OPTIONAL** | Harici M365 ve Meta entegrasyon anahtarları |

---

### 4. Veritabanı & Migration Stratejisi
- Geliştirme süresince oluşturulan tüm schema modelleri version-controlled Prisma modelleri olarak tanımlanmıştır.
- Production ortamında schema güncellemeleri için `npx prisma migrate deploy` veya güvenli Prisma migration komutları kullanılmalıdır.

---

### 5. Bilinen Kısıtlamalar (Known Limitations)
1. **Gerçek E-Posta Gönderimi**: Harici SMTP sunucu kimlik bilgileri girilene kadar tüm sistem e-postaları `Outbox / Simulation` modunda çalışır ve veritabanına loglanır.
2. **Microsoft 365 & Meta Entegrasyonları**: Kurumsal Azure App ID ve Meta App Token girilene kadar `NOT_CONFIGURED_EXTERNAL` durumunda kalır; çekirdek sistemi etkilemez.

---

### 6. Test & Doğrulama Kanıtları
- **Full Playwright Suite**: 24/24 PASS (0 Failed, 0 Flaky)
- **Node Unit & Integration Tests**: 101/101 PASS
- **TypeScript Typecheck**: 0 Error
- **ESLint**: 0 Error
- **Next.js Production Build**: Succeeded (186 static/dynamic routes generated)
