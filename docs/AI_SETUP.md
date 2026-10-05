# İKÜANTS AI Komuta & Operasyon Merkezi

Ekran: `/admin/ai` (ayrıca dashboard üst alanı ve her sayfada `Ctrl+J` ile açılan çekmece).

## Nasıl çalışır

1. Kullanıcı Türkçe komut yazar ("Bekleyen TEKMER yer edinme başvuruları").
2. Komut **kayıtlı bir işleme** eşlenir (`lib/ai/registry.ts`, `lib/ai/legacy-actions.ts`).
   Önce deterministik Türkçe yorumlayıcı (`lib/ai/interpreter.ts`) denenir; eşleşme yoksa ve bir dil modeli
   yapılandırılmışsa model yalnızca *hangi kayıtlı işlem ve hangi girdi* sorusunu yanıtlar (`lib/ai/provider.ts`).
3. Girdi zod şemasıyla doğrulanır; eksik bilgi uydurulmaz, kullanıcıya sorulur.
4. **Okuma/arama/analiz** işlemleri hemen çalışır ve sonuç kartı gösterir.
5. **Değişiklik yapan** işlemler önce önizlenir, `AiChangeSet` (PENDING_CONFIRMATION) olarak saklanır ve
   ancak kullanıcı "Onayla ve Uygula" dediğinde çalışır. Onayda yetki yeniden kontrol edilir, işlem
   veritabanında doğrulanır ve denetim kaydına `source: AI` ile yazılır.
6. Geri alınabilir işlemler "Geri Al" ile telafi edilir. Finansal işlemler (kira ödemesi) AI ile geri alınamaz.

## Güvenlik

- Her işlemin `[action, resource]` izni vardır; kullanıcının yetkisi yoksa işlem önerilmez/çalışmaz.
- Yüksek/kritik riskli işlemler (başvuru aşaması, program ataması, e-posta gönderimi, kullanıcı daveti, kira ödemesi)
  ek olarak `ai:high_risk_action` izni ister.
- AI ham SQL, kabuk komutu veya rastgele API çalıştıramaz; yalnızca kayıtlı işlemler vardır.
- Dil modeline veritabanı içeriği gönderilmez. Kullanıcı metnindeki T.C. kimlik, IBAN, kart numarası,
  parola ve anahtarlar gönderilmeden önce maskelenir.
- "Önceki talimatları yok say", `DROP TABLE` gibi komutlar engellenir ve denetim kaydına yazılır.
- Onay 30 dakika geçerlidir; aynı plan iki kez çalıştırılamaz; başkasının planı onaylanamaz.

## Dil modeli bağlama (opsiyonel)

`.env` içine yalnızca birini ekleyin:

```env
OPENAI_API_KEY=...        # OpenAI veya OpenAI uyumlu (AI_BASE_URL ile)
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
AI_MODEL=...              # boşsa sağlayıcıya göre varsayılan model
AI_TIMEOUT_MS=20000
```

Anahtar yoksa durum `PENDING_EXTERNAL_CONFIGURATION` olarak görünür ve tanımlı Türkçe komutlar çalışmaya devam eder.

## Yeni işlem eklemek

`lib/ai/registry.ts` içinde `AiActionDefinition` ekleyin: `id`, `permission`, `risk`, `kind`, zod `input`,
`execute`; değişiklik yapan işlemler için `preview`, `verify` ve mümkünse `undo`. İşlem iş kuralını
mutlaka ilgili servis katmanı (`lib/services/*`) üzerinden uygulamalıdır. Gerekirse `interpreter.ts`
içine Türkçe kalıp ekleyin ve `tests/ai-engine.test.ts` ile test edin.
