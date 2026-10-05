# İKÜANTS TEKMER — OPERASYONEL YÖNETİCİ REHBERİ (ADMIN GUIDE)
### Yazılım Geliştiriciye İhtiyaç Duymadan Tam Sistem Yönetimi

Bu kılavuz, **İKÜANTS TEKMER** yönetim paneli üzerinden gerçekleştirilebilecek tüm operasyonel işlevleri adım adım açıklar. Sistem, işletme personelinin kod değiştirmeden veya geliştirici çağırmadan günlük TEKMER süreçlerini yürütebileceği şekilde tasarlanmıştır.

---

## İÇİNDEKİLER

1. [Dashboard & Kişisel Çalışma Alanı (Benim Günüm)](#1-dashboard--benim-günüm)
2. [CRM: Kişi, Şirket & Girişimci Yönetimi](#2-crm-kişi-şirket--girişimci-yönetimi)
   - [Şirket Personeli Nasıl Eklenir?](#şirket-personeli-ekleme)
   - [Girişimciye Program Nasıl Atanır?](#girişimciye-program-atama)
   - [Girişimci Hangi Şirkete Bağlı?](#girişimci-şirket-ilişkisi)
3. [Program & Çoklu Başvuru Kampanyaları](#3-program--başvuru-yönetimi)
   - [Yeni Program Nasıl Açılır?](#yeni-program-açma)
   - [TEKMER ve Ideathon Başvuruları Nasıl Ayrılır?](#başvuru-türleri)
4. [Dinamik Form Yönetimi & Soru Düzenleme](#4-dinamik-form-merkezi)
   - [Form Sorularını Değiştirme](#soru-düzenleme)
5. [Görev & İş Akışı Operasyonları](#5-görev-yönetimi--kanban)
   - [Görev Atama & Durum Geçişleri (Başlat / Kontrole Gönder / Tamamla)](#görev-akışı)
   - [Personel Yetkileri & Gizlilik](#görev-yetkileri)
6. [E-Posta Merkezi & Bildirimler](#6-e-posta-merkezi)
   - [Şablon Oluşturma & Değişkenler](#şablon-ve-değişkenler)
   - [Sistemden Mail Gönderme & Outbox Modu](#mail-gönderimi)
7. [Ortak Alan & Rezervasyon Yönetimi](#7-ortak-alan--rezervasyon-yönetimi)
   - [Müsaitlik Kontrolü](#müsaitlik-kontrolü)
   - [Bekleyen Talepleri Onaylama / Reddetme](#rezervasyon-onayı)
8. [Finans & Kira Operasyonları](#8-finans--kira-yönetimi)
9. [Dinamik Rapor Merkezi](#9-dinamik-rapor-merkezi)
   - [Yıllık ve Aylık Raporlar](#rapor-oluşturma)
   - [Otomatik raporlar ve sürümleme](#9-rapor-merkezi)
10. [CMS Site Kontrol Merkezi](#10-cms-site-kontrol-merkezi)
    - [Ana Menü & Alt Menü Ekleme](#menü-yönetimi)
    - [Footer Bağlantılarını Düzenleme](#footer-yönetimi)
    - [Banner & Slider Değiştirme](#banner-yönetimi)
11. [Denetim Kayıtları, AI ve Sistem](#11-denetim-kayıtları-ai-ve-sistem)
12. [Site Görünümünü Özelleştirme ve Tasarım Stüdyosu](#12-site-görünümünü-özelleştirme)
13. [İş Takip Merkezi: yapılacaklar, iş paslama, süre ve rapor](#13-iş-takip-merkezi)
14. [Site Ayarları, Footer ve Çerez Bildirimi](#14-site-ayarları-footer-ve-çerez-bildirimi)
15. [Bildirim Kuralları](#15-bildirim-kuralları)
16. [Roller, Kişisel Yetkiler ve Personel Profili](#16-roller-kişisel-yetkiler-ve-personel-profili)
17. [Ekipler, İş Planlama, Şablonlar ve Otomasyon](#17-ekipler-iş-planlama-şablonlar-ve-otomasyon)
18. [Makine Parkı ve Fiyat Teklifi](#18-makine-parkı-ve-fiyat-teklifi)
19. [Ön Muhasebe](#19-ön-muhasebe)
20. [Entegrasyon Merkezi ve Dış Sistem API](#20-entegrasyon-merkezi)
21. [Animasyonlar ve Form Kutlaması](#21-animasyonlar-ve-form-kutlaması)

---

## 1. Dashboard & Benim Günüm

- **Giriş:** `/admin/dashboard` veya `/admin/benim-gunum`
- **Benim Günüm:** Günlük odak görevlerinizi, yaklaşan randevularınızı ve bekleyen acil onaylarınızı tek ekranda toplar.
- **Hızlı Aksiyonlar (+ Yeni):** Sağ üst köşede yer alan `+ Yeni` butonu üzerinden tek tıkla Kişi, Şirket, Görev, Rezervasyon veya E-posta başlatabilirsiniz.

---

## 2. CRM: Kişi, Şirket & Girişimci Yönetimi

### Şirket Personeli Ekleme
1. Sol menüden **Şirketler** (`/admin/sirketler`) sekmesine gidin.
2. Personel eklemek istediğiniz şirketin kartındaki **Detay & Personeller** butonuna tıklayın.
3. Açılan şirket detay ekranında **Personeller** sekmesine gelin.
4. **[+ Personel Ekle]** butonuna tıklayın.
5. İki seçenek sunulur:
   - **Mevcut Kişiyi Bağla:** Kişi Rehberi'nde kayıtlı bir personeli seçip görev/rol atayarak bağlayabilirsiniz (çift kayıt oluşmaz).
   - **Yeni Kişi Oluştur:** Kişinin ad, e-posta, telefon ve unvanını girerek hem Kişi Rehberi'ne hem şirkete bağlayabilirsiniz.
6. İlgili kişinin yetki türünü seçin: *Birincil İletişim, Finans Yetkilisi, İmza Yetkilisi*.

### Girişimciye Program Atama
1. Sol menüden **Girişimciler** (`/admin/girisimciler`) sekmesine gidin.
2. Tabloda programı olmayan girişimcilerin yanında sarı **Program Atanmamış** rozetinin hemen sağında **[+ Program Ata]** butonu yer alır.
3. Butona tıkladığınızda (veya girişimci detayında **Programlar** sekmesi › **Program Ata**) açılan pencerede:
   - **Program / süreç:** TEKMER Yer Edinme, ANTSPARK, ANTSFire, sistemde kayıtlı diğer programlar (Glow Up vb.) veya **Diğer**. *Diğer* seçilince süreç adını yazacağınız kutu açılır.
   - Katılım Dönemi / Kohort, katılım durumu, başlangıç tarihi ve not
   girip **Kaydet** diyerek atama yapabilirsiniz.
4. TEKMER Yer Edinme ve *Diğer* seçenekleri bir program kaydına bağlı değildir; girişimcinin geçmişinde yazdığınız adla görünür. Program listesine yeni program eklemek için **Programlar & Eğitim** ekranını kullanın.

### Girişimci-Şirket İlişkisi
1. Girişimci kartında veya detay çekmecesinde **ŞİRKET & PERSONEL (EKİP)** başlığı altında girişimcinin bağlı olduğu şirket ve ekibindeki personeller doğrudan listelenir.
2. Eğer girişimcinin tüzel kişiliği kurulduysa **[Şirket Bağla]** butonuyla mevcut şirket seçilebilir.

---

## 3. Program & Başvuru Yönetimi

### Yeni Program Açma
1. Sol menüden **Programlar** (`/admin/programlar`) ekranına gidin.
2. **[+ Yeni Program]** butonuna tıklayın.
3. Program adı, sloganı, açıklaması, aşamaları ve süresini girin.
4. "Başvuru Alıyor mu?" kutucuğunu işaretlerseniz, sistem doğrudan ilişkili bir Başvuru Kampanyası kurulumu önerir.

### Başvuru Türleri
Başvurular (`/admin/basvurular`) ekranında filtrelenebilir:
- **PROGRAM:** ANTSPARK, ANTSFire, Glow Up vb. kuluçka programı başvuruları.
- **TEKMER (Fiziki Yerleşim):** Ofis, masa ve laboratuvar tahsisi talepleri.
- **IDEATHON / HACKATHON:** Yarışma ve etkinlik takım başvuruları.
- **MENTÖR:** Mentörlük başvuru havuzu.

---

## 4. Dinamik Form Merkezi

### Soru Düzenleme
1. Sol menüden **Form Merkezi** (`/admin/formlar`) ekranına gidin.
2. Değiştirmek istediğiniz formun (örn. *ANTSPARK Girişimci Başvuru Formu*) yanındaki **Sorular** butonuna tıklayın.
3. Bu ekranda:
   - Yeni soru ekleyebilirsiniz (Metin, Sayı, Seçim, Çoklu Seçim, Dosya, Tarih).
   - Mevcut soruların sırasını değiştirebilirsiniz.
   - Soruları "Zorunlu / İsteğe Bağlı" yapabilirsiniz.
   - Soru seçeneklerini güncelleyebilirsiniz.
4. **Kaydet** dediğinizde formun yeni bir versiyonu oluşturulur. Eski başvuruların veri bütünlüğü korunur, yeni başvurular ise güncel soruları görür.

---

## 5. Görev Yönetimi & Kanban

### Görev Akışı
Görevler (`/admin/gorevler/kanban`) ekranında her kartın üzerinde doğrudan operasyonel aksiyon butonları bulunur:
- **Yapılacak (TODO):** `[Başlat]` -> Durumu "Devam Ediyor" yapar.
- **Devam Ediyor (IN_PROGRESS):** `[Kontrole Gönder]` -> Durumu "Kontrol Bekliyor" yapar.
- **Kontrol Bekliyor (IN_REVIEW):** `[Onayla & Tamamla]` veya `[Düzeltmeye Gönder]`.
- **Tamamlandı (COMPLETED):** `[Yeniden Aç]`.

### Görev Yetkileri
- **Super Admin:** Kurumdaki tüm personelin görevlerini, gecikmelerini ve faaliyetlerini izleyebilir.
- **Normal Admin:** Yalnızca kendisine atanan, kendisinin oluşturduğu veya ilgili olduğu görevleri görür. Bir admin başka bir admine görev atayabilir ancak atanan kişinin tüm özel operasyon geçmişini göremez.
- **İş paslama:** Görev detayındaki **Pasla** düğmesiyle görev başka bir yöneticiye devredilir (adminler birbirine, Süper Yönetici herkese). Ayrıntılar [13. bölümde](#13-iş-takip-merkezi).

---

## 6. E-Posta Merkezi

- **Konum:** `/admin/eposta-merkezi` (sekme: Oluştur, Taslaklar, Giden kutusu, Zamanlanmış, Gönderilen, Başarısız, Şablonlar)
- **Bağlı kayıt:** Kişi, kurum, girişim, başvuru, kira sözleşmesi veya rezervasyon seçin; `{{person.fullName}}`, `{{rent.remainingAmount}}` gibi değişkenler o kaydın gerçek verisiyle doldurulur. Doldurulamayan değişken varsa gönderim engellenir (önizlemede listelenir).
- **Taslak / Zamanla / Gönder:** Taslaklar sonradan düzenlenip gönderilebilir; zamanlama Türkiye saatine göredir ve zamanlayıcı (`CRON_SECRET`) gerektirir.
- **Sağlayıcı yoksa:** SMTP tanımlı değilse e-postalar Giden kutusunda `Kuyrukta` bekler; hiçbir zaman "Gönderildi" olarak işaretlenmez. Sağlayıcı tanımlanınca "Kuyruğu işle" veya zamanlayıcı ile gönderilir.
- **Şablonlar:** İletişim şablonları (düz metin) oluşturulabilir/silinebilir; sistem şablonları (otomatik e-postalar, HTML) yalnızca düzenlenebilir. "Test gönder" ile deneme yapılır.
- Kişi/kurum 360° görünümünden ve AI komutlarından da e-posta taslağı başlatılabilir.

---

## 7. Ortak Alan & Rezervasyon Yönetimi

### Alan Envanteri & Müsaitlik
- **Konum:** `/admin/alanlar`
- Sistemde 9 ana master alan tanımlıdır:
  * Broadcasting Stüdyosu (STUDIO-01)
  * AR/VR Stüdyosu (STUDIO-02)
  * Sanal Çekim Stüdyosu (STUDIO-03)
  * Prototipleme Laboratuvarı (LAB-01)
  * Seminer Alanı (SEMINAR-01)
  * Kapalı Toplantı Odası (MEETING-01)
  * Açık Toplantı Masası 1 — 8 Kişilik (OPEN-TABLE-01)
  * Açık Toplantı Masası 2 — 8 Kişilik (OPEN-TABLE-02)
  * Açık Toplantı Masası — 20 Kişilik (OPEN-TABLE-03)

### Public Müsaitlik & Rezervasyon
- Ziyaretçiler `https://www.ikuantstekmer.com/kullanim-alanlari` sayfasına girerek:
  1. "Hemen Müsait Alan Bul" widget'ı ile tarih ve saat sorgulayabilir.
  2. Kartlardaki **[Talep Oluştur]** butonuna tıklayarak formu doldurabilir.
  3. Talep anında Admin paneline **Bekleyen Talepler** sekmesine düşer.
  4. Yetkili Admin detayları inceleyip **[Onayla]** veya gerekçe belirterek **[Reddet]** diyebilir.
  5. Onaylanan rezervasyon otomatik olarak Ortak Takvim'e (`/admin/takvim`) işlenir ve talep sahibine onay maili üretilir.

---

## 8. Finans & Kira Yönetimi

- **Konum:** `/admin/finans` ve `/admin/finans/kiralar`
- TEKMER sakinlerinin kira sözleşmeleri, aylık tahakkukları ve tahsilatları bu ekrandan yönetilir.
- Geciken kiralar için tek tıkla **[Hatırlatma E-Postası Gönder]** aksiyonu çalıştırılabilir.

---

## 9. Rapor Merkezi

- **Konum:** `/admin/raporlar`
- **Otomatik kurumsal raporlar:** Günlük, aylık ve yıllık özetler Türkiye takvimine göre otomatik oluşturulur (zamanlayıcı veya "Otomatik raporları kontrol et" düğmesi). Aynı dönem iki kez oluşturulmaz; kaçırılan dönemler (son 7 gün / 3 ay / 1 yıl) tamamlanır.
- **Veri değişirse:** Rapor oluşturulduktan sonra o dönemin kayıtları değişirse rapor "Veriler değişti" olarak işaretlenir; "Yeni sürüm oluştur" ile güncel sürüm üretilir, eski sürüm saklanır.
- **Akış:** Otomatik taslak / Taslak → Onaya gönder → Onayla (`reports:approve`) → Yayınla (`reports:publish`). Onaylanmış rapor düzenlenemez.
- **Dışa aktarma:** Rapor detayında "Yazdır / PDF" (tarayıcı yazdırma); rapor sayfalarında CSV dışa aktarma (`reports:export`).
- Farklı para birimleri toplanmaz, ayrı gösterilir.

---

## 10. CMS Site Kontrol Merkezi

- **Ana sayfa & banner:** `/admin/anasayfa`
- **Sayfalar / Hakkımızda:** `/admin/sayfalar`, `/admin/hakkimizda`
- **Menü & footer:** `/admin/menuler`
- **Haberler:** `/admin/haberler` (taslak → yayın)
- Yayın yetkisi `cms:publish` / `news:publish` ile sınırlıdır. AI ile oluşturulan banner ve haberler her zaman taslak olarak eklenir.

---

## 11. Denetim Kayıtları, AI ve Sistem

- **Denetim kayıtları:** `/admin/audit-log` — kim, ne zaman, hangi kayıt, eski/yeni değer. AI ile yapılan işlemler `source: AI` olarak işaretlenir.
- **AI Komuta Merkezi:** `/admin/ai` (veya `Ctrl+J`). Okuma komutları hemen sonuç verir; kayıt değiştiren komutlar önce önizlenir, "Onayla ve Uygula" ile çalışır, uygunsa "Geri Al" ile telafi edilir. Ayrıntı: `docs/AI_SETUP.md`.
- **Arama:** `Ctrl+K` — yetkili olduğunuz kişi, girişim, başvuru, form, görev, alan, sözleşme ve sayfalarda arar.
- **360° görünüm:** Rehberde kişi/kurum kartındaki "360°" düğmesi; bağlı başvuru, görev, rezervasyon, doküman, e-posta ve sözleşmeleri gösterir. `/admin/rehber?personId=...` bağlantısı doğrudan açar.
- **Takvim:** `/admin/takvim` — görev terminleri, eğitim/etkinlik, rezervasyon, görüşme takipleri, sözleşme bitişleri ve kira vadeleri (yalnızca yetkili modüller).
- **Sistem sağlığı:** `/admin/sistem-sagligi` — veritabanı, depolama, güvenlik anahtarı, e-posta, zamanlayıcı, AI ve entegrasyonların gerçek durumu.
- **T.C. kimlik görüntüleme:** Süper Yönetici dahil açık `persons:identity_view` izni gerekir; her görüntüleme denetim kaydına yazılır.

---

## 12. Site Görünümünü Özelleştirme

### Programlar: afiş, banner ve renkler
- **Konum:** `/admin/programlar` → program → **3. Görünüm, Afiş & Renkler**
- **Afiş** (dikey), **banner** (masaüstü/mobil), **logo** ve **galeri** medya kütüphanesinden seçilir veya yüklenir.
- **Renk teması:** hazır temalardan seçin veya ana / ikinci / vurgu rengini kendiniz belirleyin; buton stili ve köşe yumuşaklığı ayarlanır. Sağdaki kart canlı önizlemedir.
- Program kartlarında **Başvur** butonu programın **açık başvuru kampanyasının formuna** gider; kampanya yoksa "Başvurular yakında" görünür. **Bilgi Al** detay sayfasını açar; detay sayfasındaki **Bilgi Al** iletişim formunu program adıyla doldurur.

### Kullanım alanları: fotoğraflar ve kategoriler
- **Konum:** `/admin/alanlar` → alan → **Fotoğraflar** sekmesi. Kapak fotoğrafı ve açıklamalı galeri eklenir, sıralanır, galeriden kapak seçilebilir.
- Public sayfada alanlar türüne göre gruplanır: Stüdyolar, Laboratuvarlar, Toplantı Odaları ve Masaları, Seminer ve Etkinlik Alanları, Çalışma Alanları. Grup, alanın **Tür** alanından gelir.

### Tasarım Stüdyosu (Ana sayfa, Programlar, Destekler, Kullanım alanları)
- **Konum:** Sol menü → CMS & WEB → **Tasarım Stüdyosu** (`/admin/tasarim-studyosu`). Ana Sayfa & Banner ekranındaki **Tasarım Stüdyosu** sekmesi de aynı aracı açar.
- **Sayfa seçimi:** Üstteki sekmelerden düzenlenecek sayfayı seçin. Her sayfanın düzeni, taslağı ve sürüm geçmişi ayrıdır.
- **Canlı tuval:** Sağda sayfanın taslak hâli gerçek görünümüyle açılır. Bir bölüme tıklayınca soldaki düzenleyicide açılır. Masaüstü / tablet / mobil görünümü üst çubuktan değiştirilir.
- **Sürükle-bırak:** Bölümün yerini değiştirmek için
  1. tuvaldeki bölümün sağ üstündeki tutamacı (⋮⋮) tutup başka bir bölümün üstüne veya altına bırakın, **ya da**
  2. soldaki listede satırı tutup sürükleyin, **ya da**
  3. ↑ / ↓ düğmelerini kullanın.
  Göz simgesi bölümü gizler, çöp kutusu kaldırır, kopya simgesi (çoklu kullanılabilen bölümlerde) çoğaltır.
- **Otomatik kayıt:** Her değişiklik birkaç saniye içinde taslağa kaydedilir; üst çubukta "Kaydediliyor… / Taslak kaydedildi" görünür. Kayıt başarısız olursa **Tekrar dene** çıkar; kaydedilmemiş değişiklik varken sayfadan çıkmak istediğinizde tarayıcı uyarır.
- **Geri al / Yinele:** Üst çubuktaki oklar veya Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y). Gizlenen ya da kaldırılan bölümler de geri alınabilir.
- **Metinler:** Sayfaya ait bölümlerin (ör. Destekler giriş metni ve başvuru kutusu, Kullanım alanları giriş metni, Programlar başlığı) metinleri düzenleyiciden değiştirilir. Boş bırakılan alanda sitenin orijinal metni görünür.
- **Eklenebilir bölümler:** Görselli banner, Çağrı (CTA), Sayılar, Metin, Form, Görsel galerisi, Programlar, Kullanım alanları, Destekler (ana sayfada ayrıca Hero slider, Farklarımız, Girişimciler, Partner logoları). Bölüm, seçili bölümün altına eklenir.
- **Tasarım dili:** Orijinal (mevcut görünüm), Kurumsal, Minimal, Canlı, Sıcak veya Özel; renkler, başlık yazı stili, köşe ve boşluk. Yalnızca seçili sayfaya uygulanır.
- **Yayın akışı:** Taslak yalnızca yetkili yöneticilere görünür (**Önizle** yeni sekmede açar). **Yayınla** (`cms:publish`) ziyaretçilere açar. Her yayından önceki sürüm saklanır (son 20); **Sürümler** sekmesinden veya "Orijinal düzen" ile taslağa geri yüklenebilir. **Taslağı sil** yayındaki sürüme döner.

### Formu başka sayfalara yerleştirme
- **Konum:** Form Merkezi → form → **Kullanıldığı Yerler** → **Başka sayfalara yerleştir**
- Hedefler: program detay sayfası, destekler sayfası, kullanım alanları sayfası, bağımsız form sayfası (`/formlar/<form-adresi>`). Ana sayfaya eklemek için Tasarım Stüdyosu'nda **Form** bölümü kullanılır. Yerleşimler gizlenebilir veya kaldırılabilir; form kendi sayfasında kalır.

### Destekler
- **Konum:** `/admin/destekler` — açıklama, **örnek senaryo**, buton metni/linki (boşsa iletişim formu bu konuyla açılır), mevzuat linki, ikon ve kart rengi düzenlenir.

---

## 13. İş Takip Merkezi

**Konum:** Sol menü → İş & Operasyon → **İş Takip Merkezi** (`/admin/is-takip`). Rapor: **Raporlar → İş Takip Raporu** (`/admin/raporlar/is-takip`).

### Yapılacaklarım
- Üstteki satıra yazıp Enter'a basın; termin, öncelik ve kategori seçilebilir.
- Filtreler: Bugün, Geciken, Yaklaşan, Tümü, Tamamlanan.
- Satırları tutup sürükleyerek öncelik sırası verin; sıra kaydedilir.
- Bir yapılacağı açınca: kontrol listesi, tekrar (her gün / hafta içi / haftalık / aylık), tahmini süre, etiketler, elle süre girişi. Tekrarlayan bir iş tamamlanınca bir sonraki tarih için kontrol listesi sıfırlanmış yeni kopyası oluşur.
- **Göreve dönüştür** ile yapılacak, ekip görev listesine taşınır.

### İş paslama
- Görevler ekranında görevi açın → **Pasla** → kişiyi arayın → (isteğe bağlı) not yazın → **Pasla**.
- Görev seçilen kişiye atanır, sizin atamanız ona devredilir, kişiye bildirim gider.
- Alıcı **Bana paslananlar** sekmesinde **Kabul et** veya **Geri pasla** (not zorunlu) seçer. Geri paslanan görev size geri atanır ve bildirim alırsınız.
- Paslayabilecek kişiler: görevin atananı, oluşturanı, tüm görevleri görme yetkisi olanlar ve Süper Yönetici. Aynı anda bir görev için tek bekleyen pas olabilir.
- **Paslarım** sekmesi verdiğiniz pasların durumunu gösterir. Tüm paslar denetim kaydına yazılır.

### Süre takibi
- Görev detayında **Süre başlat / Süreyi durdur**. Yeni bir süre başlatmak çalışan süreyi otomatik durdurur; çalışan süre üstte şerit olarak görünür.
- Unutulan çalışmalar için elle süre girilir (1–1440 dakika). Göreve girilen süre, görevin "gerçekleşen saat" alanını günceller.
- **Zaman çizelgesi** sekmesi son 7 günün dağılımını ve kayıtları gösterir.

### İş Takip Raporu
- Tarih aralığı (hazır: bu hafta, bu ay, geçen ay, son 30 gün, son 90 gün veya özel aralık) ve kişi filtresi.
- Kişi başına: tamamlanan, zamanında tamamlanma oranı, açık, geciken, kontrolde, ortalama tamamlanma süresi, girilen saat, verilen / alınan / geri gelen pas, tamamlanan yapılacak, yorum.
- Günlük grafik, tamamlanan ve geciken iş listeleri. **Yazdır / PDF** ve **CSV** (Excel uyumlu) dışa aktarma; dışa aktarma denetim kaydına yazılır.
- Tüm görevleri görme yetkisi (`view_all:tasks`) olmayan kullanıcı raporda yalnızca kendi verisini görür.

---

## 14. Site Ayarları, Footer ve Çerez Bildirimi

**Konum:** Sistem → **Ayarlar** (`/admin/ayarlar`). Yalnızca değiştirdiğiniz alanlar kaydedilir.

- **Genel:** site adı ve açıklaması, telefon, footer e-postası (`bilgi@`), iletişim sayfası e-postası (`info@`), adres, çalışma saatleri, sosyal medya (Instagram, LinkedIn, WhatsApp, YouTube, X).
- **Footer:** footer metni ve telif satırı. `{yıl}` yazılan yere içinde bulunulan yıl gelir. **"Design By Alperen Tağman" ibaresi kilitlidir:** ayarlardan değiştirilemez veya kaldırılamaz; telif satırına yazılırsa otomatik çıkarılır.
- **Çerez bildirimi:** açık / kapalı, başlık, metin, düğme metinleri, politika sayfası adresi ve politika metni. **Sürüm** değerini artırmak tüm ziyaretçilere bildirimi yeniden gösterir.
- Ziyaretçi tercihini "Kabul et", "Sadece zorunlu" veya "Tercihler" ile verir; tercih tarayıcıda saklanır ve footer'daki **Çerez tercihleri** bağlantısıyla değiştirilebilir. Politika sayfası: `/cerez-politikasi`.

---

## 15. Bildirim Kuralları

**Konum:** Ayarlar → **Bildirim Kuralları**.

- Başvuru, iletişim talebi, form gönderimi, rezervasyon ve makine fiyat teklifi geldiğinde **tüm aktif Süper Yöneticilere her zaman** uygulama içi bildirim ve e-posta gider. Bu kural kapatılamaz.
- İlgili modülü görme yetkisi olan adminler (ör. başvurular için `applications:view`) varsayılan olarak bilgilendirilir. Her olay için bu kapatılabilir.
- Her olaya ek e-posta adresleri eklenebilir (ör. muhasebe@…). Form ve kampanya ayarındaki bildirim adresleri ile sunucudaki `ADMIN_NOTIFICATION_EMAIL` da eklenir.
- Sayfa, şu anda kimin bildirim alacağını adıyla gösterir.
- SMTP tanımlıysa e-posta oluşturulduğu anda gönderilir. Tanımlı değilse E-Posta Merkezi › Outbox'ta "Beklemede" kalır; hiçbir zaman "gönderildi" denmez.

## 16. Roller, Kişisel Yetkiler ve Personel Profili

### Roller
- **Konum:** Yönetim & Sistem → **Roller & İzinler**.
- Soldan rolü seçin, sağdaki izin matrisinde modül modül işaretleyin, **Kaydet**.
- **Yeni rol** ile "Muhasebe", "Kurumsal İletişim", "Tanıtım", "Uzman" gibi roller açılır; mevcut bir rolün izinleri kopyalanabilir.
- Süper Yönetici rolü değiştirilemez. Sistem rolleri silinemez; özel roller kullanıcısı yoksa silinir.

### Kişiye özel yetki
- **Konum:** Kullanıcılar → kullanıcı → **Yetkiler** sekmesi.
- Her izin üç durumludur: rolden gelen (✓), kişiye **ek olarak verilen** (+) ve kişiye **özel olarak engellenen** (✕). Tıklayarak değiştirilir.
- Yetki dağıtmak için `roles:manage` gerekir. Süper Yönetici olmayan bir yönetici, kendisinde olmayan izni başkasına veremez ve kendi yetkisini değiştiremez.
- Süper Yöneticinin yetkisi kısıtlanamaz. Tüm değişiklikler denetim kaydına yazılır.

### Personel profili (iç ekip)
- Kullanıcılar → kullanıcı → **Profil & Bilgiler**: fotoğraf, unvan, departman, telefon, **çalışma türü** (tam zamanlı, yarı zamanlı, stajyer, danışman, proje bazlı, gönüllü), **işe başlama tarihi** ve **SGK durumu**.
- SGK durumu kod olarak değil, açıklayıcı tanım olarak seçilir. Liste **Ayarlar → İK Tanımları**'ndan düzenlenir.

### Firma personeli
- Rehber → kişi kaydında şirket bağlantısına çalışma türü, SGK durumu ve **Ar-Ge / tasarım personeli** işareti eklenir.
- Kişi fotoğrafı aynı formdan yüklenir.

## 17. Ekipler, İş Planlama, Şablonlar ve Otomasyon

### Ekipler
- **Konum:** İş & Operasyon → **Ekipler**.
- Ekip adı, renk, lider ve üyeler belirlenir. Kartta açık, geciken ve son 30 günde biten iş sayısı görünür.
- Ekip oluşturmak için `teams:manage` gerekir.

### Görevlerde yeni alanlar
- Görev oluştururken **ekip**, **başlangıç tarihi**, **tekrar** (her gün, hafta içi, haftalık, aylık, 3 ayda bir, yıllık) ve **izleyenler** seçilir.
- Görev detayında:
  - **Alt görevler** eklenir; ilerleme çubuğu gösterilir.
  - **İzle / İzlemeyi bırak** ile durum değişikliği ve yorum bildirimleri alınır.
  - Ekip, tekrar ve başlangıç tarihi değiştirilebilir.
- Tekrarlayan bir görev tamamlanınca bir sonraki dönemi otomatik oluşur: aynı ekip, atananlar, izleyenler ve sıfırlanmış kontrol listesiyle.

### İş Planlama
- **Konum:** İş & Operasyon → **İş Planlama**.
- **Takvim:** aylık görünümde terminler; renk ekibi, nokta önceliği gösterir.
- **Zaman çizelgesi:** 6 haftalık Gantt görünümü; başlangıç → termin çubukları.
- **Ekip yükü:** kişi başına açık, geciken ve yüksek öncelikli iş sayısı ile tahmini saat.
- Ekip ve kişi filtresi vardır; bir işe tıklayınca ayrıntısı açılır.

### Şablonlar
- **Konum:** İş & Operasyon → **Şablon & Otomasyon** → Görev şablonları.
- Şablonda başlık, açıklama, kontrol listesi, alt görevler, öncelik, termin günü ve tekrar tanımlanır.
- **Görev oluştur** ile tek tıkla tam bir görev açılır. Görevler sayfasındaki **Şablondan** düğmesi buraya götürür.

### Otomasyon kuralları
- "Ne zaman?": görev oluşturulduğunda, durumu değiştiğinde, tamamlandığında, gecikmeye düştüğünde, pas geri gönderildiğinde.
- Koşullar (opsiyonel): ekip, öncelik, yeni durum.
- Eylemler:
  - kişiye, ekip liderine, izleyicilere veya oluşturana bildirim;
  - izleyici ekleme, kişi atama;
  - öncelik değiştirme;
  - takip görevi oluşturma.
- Hazır örneklerle başlanabilir. Her çalışma kaydedilir; son çalışmalar kural kartında görünür.
- Kurallar başka kuralları tetiklemez (sonsuz döngü olmaz). Kural yönetimi için `automations:manage` gerekir.
- Gecikme kuralları zamanlayıcıyla çalışır (bkz. DEPLOYMENT).

## 18. Makine Parkı ve Fiyat Teklifi

- **Public sayfa:** Kullanım Alanları'nda üç yeni grup var:
  - **Lazer Kesim:** Lazerpol lazer kesim makinesi, EBH lazer kesim ve hizalama makinesi.
  - **Elektronik Dizgi (SMT):** lehim pastası baskı makinesi, NeoDen YY1 pick and place, T-937M reflow fırını.
  - **3D Baskı:** Bambu Lab H2D.
- Toplantı ve ortak alan kartlarında "Ücretsiz", makinelerde "Ücretli · fiyat teklifi ile" etiketi görünür.
- Makineler de rezervasyon talebiyle ayrılır. Talep gönderildikten sonra ve makine kartında **Fiyat Teklifi Talep Et** düğmesi vardır.
  - Formda makine, kullanım amacı, tahmini süre (saat), adet, teslim tarihi, malzeme ve iş detayları sorulur.
  - Talep Form Merkezi'ne kaydedilir; Süper Yöneticilere ve rezervasyon yetkilisi adminlere e-posta ile bildirilir.
- **Admin:** Alanlar → alan → **Kullanım tarifesi** bölümü.
  - Ücretlendirme seçilir: ücretsiz, fiyat teklifi ile veya saatlik ücret (KDV hariç).
  - Public sayfada görünecek tarife notu yazılır.
  - Makine listesi ve teknik özellikleri düzenlenir.
- Teknik bilgiler yalnızca doğrulanmış kaynaktan girildi:
  - NeoDen YY1 ve T-937M: kullanım kılavuzu ve kullanıcı ölçümleri.
  - Bambu Lab H2D: satıcı ürün sayfası.
  - Lazer makinelerinin model bilgileri bulunamadığı için boş bırakıldı; ölçüler bilinince girilmeli.
- Teklif formunun soruları Form Merkezi'nde **Makine Kullanımı Fiyat Teklifi Talebi** adıyla düzenlenebilir.

## 19. Ön Muhasebe

**Konum:** Finans → **Ön Muhasebe** (`/admin/muhasebe`).

- **Başlarken:** en az bir kasa / banka hesabı ve bir cari ekleyin.
- **Cariler:** müşteri / tedarikçi; VKN (10 hane, T.C. kimlik no girilmez), vergi dairesi, IBAN, iletişim. **Ekstre** ile borç / alacak / bakiye dökümü alınır.
- **Satış faturası:**
  - Kalemler, miktar, birim fiyat, iskonto, KDV (%0 / 1 / 10 / 20) ve KDV tevkifatı (2/10 – 10/10) girilir; toplamlar canlı hesaplanır.
  - Önce **taslak** kaydedilir. **Faturayı kes** ile GİB biçiminde numara verilir (`IKT2026000000001`) ve fatura kilitlenir.
  - Kesilen fatura düzenlenemez; tahsilatı yoksa nedeni yazılarak iptal edilir.
  - **Yazdır** A4 çıktı / PDF verir.
- **Tahsilat:** faturaya bağlanır, kalan tutarı aşamaz. Fatura otomatik olarak "Kısmi tahsil" / "Tahsil edildi" olur.
- **Kasa & Banka:** hesap bakiyeleri. **Gider / ödeme**, **Gelir / tahsilat** ve hesaplar arası **Virman** buradan girilir; kategori ve belge no tutulur.
- **Özet:** yıllık faturalanan, tahsilat, gider, açık ve vadesi geçen alacak, nakit; aylık grafik ve gider dağılımı.
- **KDV özeti:** aylık hesaplanan, tevkif edilen ve indirilecek KDV (indirilecek KDV, Finans › Faturalar'daki gelen faturalardan) ile tahmini ödenecek / devreden tutar. Bilgi amaçlıdır; beyanname mali müşavir tarafından hazırlanır.
- **e-Fatura:** Entegrasyon Merkezi'nde e-Fatura entegratörü bağlı değilse fatura "Entegratör bekleniyor" durumunda kalır. Sistem gönderilmemiş bir faturayı hiçbir zaman "gönderildi" olarak göstermez.
- **Yetkiler:** `finance:view` görüntüleme; `finance:create` taslak, cari ve hareket; `finance:update` cari / hesap düzenleme; `finance:approve` fatura kesme, iptal ve hareket silme.

## 20. Entegrasyon Merkezi

**Konum:** Yönetim & Sistem → **Entegrasyon Merkezi**.

- **Bağlantılar:**
  - Hazır kartlar: KOSGEB, TÜBİTAK, Sanayi ve Teknoloji Bakanlığı, e-Fatura entegratörü, Paraşüt, Logo, Mikro, banka, SMS, Slack, Microsoft Teams, Google Workspace ve **Özel REST API**.
  - Kurum veya firma size API erişimi verdiğinde servis adresini (https) ve kimlik bilgilerini girip **Test et**'e basın.
  - Kimlik doğrulama türleri: API anahtarı başlığı, Bearer token, kullanıcı adı / parola, adres parametresi.
- **Güvenlik:**
  - Anahtar ve parolalar veritabanında şifreli saklanır (`INTEGRATION_ENCRYPTION_KEY`) ve ekrana bir daha gelmez; yalnızca kısa bir ipucu görünür.
  - İç ağ ve yerel adreslere bağlantı engellenir; yalnızca https adreslerine bağlanılır.
  - Tüm çağrılar **Çağrı kayıtları** sekmesinde tutulur. Adres parametreleri kaydedilmez, çünkü anahtar içerebilir.
- **Webhook'lar:**
  - Yeni başvuru, iletişim, form, rezervasyon, fiyat teklifi, tamamlanan görev ve kesilen fatura olaylarında seçtiğiniz adrese imzalı bildirim gönderilir.
  - İmza başlığı `X-Ikuants-Signature` (HMAC-SHA256). İmza anahtarı yalnızca webhook oluşturulurken bir kez gösterilir.
  - Bildirimlerde kişisel kimlik verisi yoktur; yalnızca kayıt numarası ve bağlantı vardır.
- **API anahtarları:**
  - Dış sistemlerin salt okunur erişimi için kapsamlı anahtarlar oluşturulur (`applications:read`, `tasks:read`, `reservations:read`, `finance:read`).
  - Anahtar bir kez gösterilir; yalnızca özeti saklanır. İstenen anda iptal edilir; geçerlilik süresi verilebilir.
- **Dış API uçları** (`Authorization: Bearer ik_…`, dakikada 120 istek):
  - `GET /api/v1/ping`
  - `/api/v1/applications`
  - `/api/v1/tasks`
  - `/api/v1/reservations`
  - `/api/v1/invoices`
  - Parametreler: `?since=` ve `&limit=`.
- Yönetim için `integrations:manage`, görüntüleme için `integrations:view` gerekir.

## 21. Animasyonlar ve Form Kutlaması

**Konum:** Ayarlar → **Animasyonlar**.

- **Genel hareket seviyesi:**
  - Tam: tüm hareketler.
  - Azaltılmış: büyük kayma ve büyüme hareketleri kapalı.
  - Kapalı: hareket yok.
  - İşletim sisteminde "hareketi azalt" seçen ziyaretçiler her durumda sakin görünümü görür.
- **Form gönderim kutlaması:** başvuru, iletişim, rezervasyon ve teklif formları başarıyla gönderildiğinde gösterilir.
  - Stil: uçan roket, konfeti veya sade onay.
  - Başlık (varsayılan "Başarıyla alınmıştır!"), açıklama ve ekranda kalma süresi (2–10 saniye) ayarlanır.
  - Formun kendi başarı mesajı varsa açıklama yerine o gösterilir; referans numarası da görünür.

## 22. Haberler ve Duyurular

- **Admin › Haberler** ekranı tek kaynaktır. Yayınlanan her haberin kalıcı, paylaşılabilir bir sayfası vardır: `/haberler/<slug>`.
  - Haber sayfası tam metni, fotoğraf galerisini (büyütülebilir), kayıt bağlantısını, paylaşım düğmelerini ve diğer haberleri gösterir.
  - Arama motorları için başlık, açıklama ve NewsArticle yapısal verisi otomatik üretilir.
- **Ana sayfa bölümü:** Tasarım Stüdyosu'ndaki "Haberler & duyurular" bölümü son haberleri kartlarla gösterir.
  - Başlık, alt başlık ve gösterilecek haber sayısı (1–12) düzenlenebilir. Bölüm gizlenebilir veya taşınabilir.
  - Hiç kayıtlı düzen yoksa ana sayfa varsayılan olarak bu bölümü içerir.
- **Eski web sitesi haberleri:** `npx tsx scripts/import-legacy-news.ts` önce ne yapacağını listeler; `--apply` ile yazar.
  - Eksik haberler orijinal tarih, kategori ve galeriyle eklenir. Kısaltılmış eski kayıtlar, yalnızca kimse düzenlemediyse tam metinle tamamlanır.
  - Komut tekrar çalıştırıldığında hiçbir şeyi değiştirmez. `npm run bootstrap:prod` bu adımı otomatik çalıştırır.
