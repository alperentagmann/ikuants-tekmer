# 3D / 360° Alan Deneyimi Rehberi

Ekran: `/admin/alanlar` → bir alan → "3D / 360° Deneyim". Public tarafta `/kullanim-alanlari` sayfasında
deneyimi olan ve "public" işaretli alanlarda "3D görüntüle" düğmesi çıkar.

## Desteklenen varlıklar

| Tür | Biçim | Öneri |
| --- | --- | --- |
| 3D model | `.glb` (tercih) veya `.gltf` | ≤ 15 MB, Draco/Meshopt sıkıştırma, dokular ≤ 2048 px |
| 360° panorama | Eşdikdörtgen (equirectangular) `.jpg` / `.webp` | 2:1 oran, 4096×2048 veya 6000×3000 |
| Poster (yüklenirken) | `.jpg` / `.webp` | 1600 px genişlik |

Görüntüleyici `@google/model-viewer` ile çalışır ve yalnızca kullanıcı açtığında yüklenir; public sayfa
performansını etkilemez. `prefers-reduced-motion` açıksa otomatik döndürme kapalıdır.

## Ekleme adımları

1. Varlığı hazırlayın (gerçek alan çekimi/modeli). Var olmayan alan için model veya görsel **üretmeyin**.
2. Alanlar → alan → Deneyim → dosyayı yükleyin (medya kütüphanesi, tür ve boyut sunucuda doğrulanır).
3. İsteğe bağlı: sıcak noktalar (hotspot) ekleyin — konum, başlık, açıklama.
4. Önizleyin; doğruysa "Public" işaretleyin ve kaydedin.

## Kontrol

- AI komutu: "3D modeli olmayan alanlar" — eksik varlıkları listeler.
- Varlığı olmayan alan public sitede "3D" düğmesi göstermez; kapasite bilgisi girilmemiş alanlarda
  "Bilgi girilmemiş" yazar.
