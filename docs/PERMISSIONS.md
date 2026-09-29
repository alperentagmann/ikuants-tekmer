# İKÜANTS TEKMER — SUPER ADMIN & ADMIN YETKİ MATRİSİ (RBAC)

Bu doküman, İKÜANTS TEKMER Yönetim Paneli ve API katmanında uygulanan **Süper Yönetici (SUPER_ADMIN)** ve **Yönetici (ADMIN / Operasyonel Roller)** arasındaki yetki ayrımını ve güvenlik kurallarını tanımlar.

---

## 👑 1. ROLLER VE GENEL İLKELER

| Rol | Rol Slug | Tanım | Yetki Kapsamı |
|---|---|---|---|
| **Süper Yönetici** | `super-admin` | Sistem sahibi, platform yöneticisi (`bilgi@ikuantstekmer.com`) | Tüm operasyon, CMS, sistem yapılandırması, roller, güvenlik ve entegrasyonlar dahil tam yetki (`*:*`). |
| **Yönetici (Admin)** | `admin` | Günlük operasyon, CRM ve içerik yöneticisi | Günlük operasyonel modüller (Görevler, Takvim, Başvurular, Girişimciler, Mentörler, Faaliyetler, Haberler). Sistem ayarları ve güvenlik merkezine erişemez. |
| **İçerik Editörü** | `content-editor` | Haber, duyuru ve medya içerik sorumlusu | Haberler, etkinlikler ve medya kütüphanesini yönetir. |
| **Başvuru Yöneticisi** | `application-manager` | Girişim ve program başvuruları CRM sorumlusu | Başvuru pipeline'ı, değerlendirme puanlaması ve iletişim talepleri. |
| **Mentör Yöneticisi** | `mentor-manager` | Mentör ağı ve seans koordinatörü | Mentör kadrosu ve eşleştirme seansları. |
| **Program Yöneticisi** | `program-manager` | Kuluçka/Hızlandırma programları yöneticisi | Programlar, eğitim müfredatı ve kohort takibi. |

---

## 🛡️ 2. DETAYLI MODÜL & ERİŞİM MATRİSİ

| Modül / Özellik | Route / API | Süper Yönetici (`super-admin`) | Normal Yönetici (`admin`) | Diğer Operasyonel Roller |
|---|---|:---:|:---:|:---:|
| **Dashboard & İstatistikler** | `/admin/dashboard` | ✅ Tam Erişim | ✅ Operasyonel Görünüm | ✅ Rol Kapsamında |
| **Benim Günüm & Kişisel Çalışma Alanı** | `/admin/benim-gunum` | ✅ Tam Erişim | ✅ Tam Erişim | ✅ Tam Erişim |
| **Kişisel To-Do & Hızlı Notlar** | `/api/admin/workspace/todos` | ✅ Tam Erişim | ✅ Tam Erişim | ✅ Tam Erişim |
| **Görevler & Kanban Panosu** | `/admin/gorevler/kanban` | ✅ Tüm Ekipler | ✅ İlgili Ekipler | ✅ Atanan Görevler |
| **Ortak Takvim & Toplantılar** | `/admin/takvim` | ✅ Tam Erişim | ✅ Tam Erişim | ✅ Okuma / Planlama |
| **Onay Bekleyenler (Approvals)** | `/admin/onaylar` | ✅ Onaylama / Red | ✅ İzne Bağlı | ❌ |
| **Başvuru Pipeline (CRM)** | `/admin/basvurular` | ✅ Tam Erişim | ✅ İnceleme / Puanlama | ✅ İnceleme (Yetkili) |
| **Girişimciler & Mentörler** | `/admin/girisimciler`, `/admin/mentorler` | ✅ Tam Erişim | ✅ CRUD & Medya | ✅ Görüntüleme / Düzenleme |
| **Paydaş & Kişi Rehberi** | `/admin/rehber` | ✅ Tam Erişim | ✅ CRUD | ✅ CRUD |
| **Programlar, Eğitimler, Etkinlikler** | `/admin/programlar`, `/admin/etkinlikler` | ✅ Tam Erişim | ✅ CRUD | ✅ Görüntüleme / Düzenleme |
| **Projeler, Hibeler & Faaliyetler** | `/admin/projeler`, `/admin/faaliyetler` | ✅ Bütçe Dahil Tam | ✅ Operasyonel | ❌ |
| **Haberler, Duyurular & Editör** | `/admin/haberler` | ✅ Yayınlama Dahil | ✅ Yayınlama Dahil | ✅ Taslak / Yayın |
| **Medya Kütüphanesi** | `/admin/medya` | ✅ Tam Yönetim | ✅ Yükleme / Seçim | ✅ Yükleme / Seçim |
| **Ana Sayfa & Hero Banner CMS** | `/admin/anasayfa` | ✅ Tam Yönetim | ✅ Banner & Slide Yönetimi | ❌ |
| **Sayfa Yönetimi (Page Builder)** | `/admin/sayfalar` | ✅ Tam Erişim | ❌ (Gizli - 403) | ❌ |
| **Form Builder & Versiyonlama** | `/admin/form-builder` | ✅ Tam Erişim | ❌ (Gizli - 403) | ❌ |
| **Partner & Logo Yönetimi** | `/admin/partnerler` | ✅ Tam Erişim | ❌ (Gizli - 403) | ❌ |
| **Menü Yönetimi (Navigation)** | `/admin/menuler` | ✅ Tam Erişim | ❌ (Gizli - 403) | ❌ |
| **Günlük & Aylık Raporlar** | `/admin/raporlar/gunluk`, `/admin/raporlar/aylik` | ✅ Tüm Kurum | ✅ Kendi / Departman | ✅ Kendi Raporu |
| **Yıllık & Kurum Geneli Rapor** | `/admin/raporlar/yillik` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |
| **Özel Rapor Stüdyosu** | `/admin/raporlar/ozel` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |
| **Sosyal Medya Gelen Kutusu** | `/admin/sosyal-medya/gelen-kutusu` | ✅ Tam Erişim | ✅ Yanıtlama / İnceleme | ❌ |
| **Sosyal Medya Entegrasyonu & Secrets**| `/admin/entegrasyonlar/sosyal-medya` | ✅ Token/API Yönetimi | ❌ (Gizli - 403) | ❌ |
| **Site Ayarları & Marka/Tasarım** | `/admin/ayarlar` | ✅ Tam Erişim | ❌ (Gizli - 403) | ❌ |
| **Kullanıcı Yönetimi & Davetler** | `/admin/kullanicilar` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |
| **Roller & İzinler Yönetimi** | `/admin/roller` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |
| **Güvenlik Merkezi & Olaylar** | `/admin/guvenlik` | ✅ Olay İnceleme | ❌ (Gizli - 403) | ❌ |
| **Sistem Sağlığı & Diagnostic** | `/admin/sistem-durumu` | ✅ Metrikler & Loglar | ❌ (Gizli - 403) | ❌ |
| **Denetim İzi (Audit Log)** | `/admin/audit-log` | ✅ Tam İnceleme | ❌ (Gizli - 403) | ❌ |
| **SEO & 301 Yönlendirmeleri** | `/admin/seo-redirects` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |
| **E-Posta Şablonları & Kuyruk** | `/admin/eposta-sablonlari`, `/admin/eposta-merkezi` | ✅ Şablon & Outbox | ❌ (Gizli - 403) | ❌ |
| **Terminoloji & Özel Alanlar** | `/admin/terimler`, `/admin/ozel-alanlar` | ✅ Tam Yetki | ❌ (Gizli - 403) | ❌ |

---

## 🔒 3. GÜVENLİK & YETKİ YÜKSELTME (PRIVILEGE ESCALATION) KORUMASI

1. **Super Admin Hesap Dokunulmazlığı:**
   - Ana Süper Yönetici hesabı (`bilgi@ikuantstekmer.com`) ve sistemdeki son aktif Süper Yönetici hesabı silinemez veya pasife alınamaz.
2. **Kendi Yetkisini Yükseltme Yasağı:**
   - Hiçbir kullanıcı kendi profilinden `isSuperAdmin`, `role` veya `permissions` değerlerini değiştiremez.
3. **Rol Atama Hiyerarşisi:**
   - Bir kullanıcı yalnızca kendi yetki seviyesinin altındaki rolleri atayabilir. Süper Yönetici olmayan hiç kimse `SUPER_ADMIN` rolü atayamaz veya API üzerinden `isSuperAdmin: true` gönderemez.
4. **Sunucu Tarafı Güvenlik Doğrulaması:**
   - Arayüzden gizleme tek başına yeterli değildir; `/api/admin/settings`, `/api/admin/roles`, `/api/admin/security` ve ilgili tüm endpoint'ler `user.isSuperAdmin` kontrolünü zorunlu kılar ve yetkisiz çağrılarda `403 Forbidden` döner.
