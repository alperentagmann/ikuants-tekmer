# İKÜANTS TEKMER — Web Sitesi ve Yönetim Platformu

Next.js 16 (App Router) + React 19 + Prisma 6 + PostgreSQL üzerinde çalışan kurumsal web sitesi ve
iç operasyon platformu.

- Public site: `http://localhost:3000`
- Yönetim paneli: `http://localhost:3000/admin`

## Hızlı başlangıç (yerel)

```bash
npm install
cp .env.example .env          # DATABASE_URL, AUTH_SECRET, IDENTITY_ENCRYPTION_KEY doldurun
npm run db:embedded           # (opsiyonel) yerel gömülü PostgreSQL, port 5432
npx prisma migrate deploy     # şemayı uygula
npm run seed                  # rol/izinler, Form Merkezi, doğrulanmış alanlar, şablonlar
npm run dev
```

Yönetici hesabı: `npm run admin` (oluştur / rol ver / listele) veya `npm run bootstrap:prod`.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Prisma client + production build |
| `npm test` | Birim/entegrasyon testleri (`tests/*.test.ts`, gerçek veritabanı ile) |
| `npx playwright test` | Uçtan uca testler (`tests/e2e`) |
| `npm run lint` | ESLint |
| `npm run seed` | Başlangıç verisi (oluştur-yalnızca; mevcut kaydı ezmez) |
| `npm run bootstrap:prod` | Production ilk kurulum (RBAC senkronizasyonu, ilk Super Admin) |
| `npx prisma migrate deploy` | Migration uygulama (production'da tek izinli yöntem) |

## Ana modüller

- **Form Merkezi** — tüm public formlar (başvuru, iletişim, staj, etkinlik, rezervasyon) tek motordan; versiyonlu yayın. Bkz. [docs/FORM_CENTER_GUIDE.md](docs/FORM_CENTER_GUIDE.md)
- **Başvuru Merkezi & Kampanyalar** — Program / TEKMER / Ideathon başvuruları ayrı iş akışlarıyla.
- **CRM** — kişi, kurum, girişim, mentör; 360° görünüm.
- **Görevler & Kanban** — Yapılacak → Devam → Kontrolde → Tamamlandı iş akışı, onay ve iade.
- **Alanlar & Rezervasyon** — doğrulanmış alan envanteri, müsaitlik, onay, tahsis, 3D/360° deneyim. Bkz. [docs/3D_ASSET_GUIDE.md](docs/3D_ASSET_GUIDE.md)
- **E-Posta Merkezi** — oluştur, taslak, zamanla, outbox, şablonlar; sağlayıcı yoksa sahte "gönderildi" yok.
- **Rapor Merkezi** — günlük/aylık/yıllık otomatik kurumsal raporlar (Europe/Istanbul), onay ve yayın akışı.
- **AI Komuta Merkezi** — Türkçe komutla yalnızca kayıtlı işlemler; önizleme, onay, denetim ve geri alma. Bkz. [docs/AI_SETUP.md](docs/AI_SETUP.md)
- **Doküman Merkezi, Bildirimler, Takvim, Ctrl+K arama, Sistem Sağlığı, Denetim kayıtları**

## Güvenlik ilkeleri

- Yetkilendirme sunucuda `resource:action` izinleriyle yapılır (`lib/rbac.ts`); menü gizleme yalnızca kolaylıktır.
- T.C. kimlik numaraları `IDENTITY_ENCRYPTION_KEY` ile şifrelenir, listelerde maskelenir; görüntüleme denetim kaydına yazılır.
- Her değişiklik `logAuditEvent` ile denetim kaydına yazılır.
- Özel dosyalar yalnızca yetki kontrollü `/api/admin/media/[id]/file` üzerinden servis edilir.

## Dokümanlar

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — kurulum, ortam değişkenleri, migration, zamanlayıcı
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — yönetici kullanım rehberi
- [HANDOFF.md](HANDOFF.md) — teslim durumu ve dış bağımlılıklar
- [docs/AI_SETUP.md](docs/AI_SETUP.md), [docs/FORM_CENTER_GUIDE.md](docs/FORM_CENTER_GUIDE.md), [docs/3D_ASSET_GUIDE.md](docs/3D_ASSET_GUIDE.md)
