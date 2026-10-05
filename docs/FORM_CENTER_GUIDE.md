# Form Merkezi Rehberi

Ekran: `/admin/form-builder`. Sitedeki tüm formlar (ANTSPARK, ANTSFire, Glow Up, TEKMER yer edinme, mentör,
iletişim/toplantı/ziyaret, öğrenci/şirket staj, etkinlik kaydı, rezervasyon talebi) bu motordan çalışır.

## Kavramlar

- **Form** → **Versiyon** → **Alanlar**. Yayındaki versiyon değiştirilemez; düzenlemeler taslak versiyonda yapılır,
  "Yayınla" ile yeni versiyon canlıya alınır. Eski gönderimler kendi versiyonuyla saklanır.
- **Alan anahtarı (fieldKey)** alanın kalıcı kimliğidir; rapor ve dışa aktarma bu anahtarla eşleşir. Yayından sonra
  anahtarı değiştirmeyin.
- **Bölümler** çok adımlı formların adımlarıdır.
- **Koşullu gösterim**: "Şu soruya şu cevap verilirse göster" (TÜMÜ / HERHANGİ BİRİ).
- **KVKK onayları**: KVKK metnine bağlı onay kutuları; gönderimde onay anlık görüntüsü saklanır.
- **Dosya yükleme**: tür ve boyut sunucuda doğrulanır; dosyalar özel depolamada tutulur.

## Başvuru kampanyaları

Ekran: `/admin/basvuru-kampanyalari`. Her kampanya bir forma ve (Program türünde) bir programa bağlıdır;
kendi iş akışı aşamaları, değerlendirme şablonu, gerekli belgeleri, aşama → e-posta şablonu eşlemesi ve
bildirim alıcıları vardır. TEKMER yer edinme kampanyası programa bağlanamaz. Kampanya kapalıysa form gönderim kabul etmez.

## Güvenlik ve veri

- Sunucu tarafında doğrulama (zorunluluk, tür, desen, T.C. kimlik algoritması).
- Bot koruması (gizli alan + minimum doldurma süresi) ve hız sınırlama.
- T.C. kimlik numaraları şifreli saklanır, ekranda maskelenir.
- Gönderimler başvuru (Application) veya iletişim talebine (ContactRequest) dönüşür; kişi/kurum eşleştirmesi
  otomatik yapılmaz, admin tarafından bağlanır.

## Sık işlemler

- Soru eklemek: Form → Düzenle → soru ekle → Taslağı kaydet → Önizle → Yayınla.
- Formu kopyalamak: listede "Kopyala" (yeni form taslak olarak oluşur).
- Gönderimleri dışa aktarmak: Form → Gönderimler → CSV (formül enjeksiyonuna karşı korumalı).
- Nerede kullanıldığını görmek: Form → Kullanım sekmesi.
