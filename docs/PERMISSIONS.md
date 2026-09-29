# İKÜANTS TEKMER — Role-Based Access Control (RBAC) & Permissions Matrix

Bu doküman, İKÜANTS TEKMER platformunda tanımlı kullanıcı rolleri, yetki alanları ve server-side yetkilendirme kurallarını detaylandırmaktadır.

---

## 1. Rol Hiyerarşisi

Sistemde tanımlı roller:

| Rol | Kod | Açıklama |
| :--- | :--- | :--- |
| **Süper Admin** | `SUPER_ADMIN` | Sistem üzerindeki en yüksek yetkiye sahip yönetici. Güvenlik, kullanıcı yönetimi, entegrasyonlar ve kritik ayarları yönetir. |
| **Admin** | `ADMIN` | Genel operasyonel yönetici. Başvuruları, içerikleri, girişimcileri, mentörleri ve süreçleri yönetir. |
| **İçerik Editörü** | `CONTENT_EDITOR` | Haber, duyuru, etkinlik, vaka çalışması ve sosyal medya gelen kutusu yönetimi yetkisine sahip kullanıcı. |
| **Başvuru Yöneticisi** | `APPLICATION_MANAGER` | Girişimci ve mentör başvurularını inceleme, puanlama ve aşama değiştirme yetkisine sahip kullanıcı. |
| **Program Yöneticisi** | `PROGRAM_MANAGER` | ANTsPARK, ANTsFIRE, GlowUp programlarını ve takvimleri yöneten kullanıcı. |
| **Mentör Yöneticisi** | `MENTOR_MANAGER` | Mentör eşleştirmeleri ve mentörlük havuzunu yöneten kullanıcı. |
| **Gözlemci / Denetçi** | `VIEWER` | Yalnızca rapor ve içerikleri okuma/izleme yetkisine sahip kullanıcı. Veri değiştiremez. |
| **Girişimci** | `ENTREPRENEUR` | Girişimci portalına erişebilen kullanıcı. Admin paneline erişimi **engellenmiştir**. |
| **Mentör** | `MENTOR` | Mentör portalına erişebilen kullanıcı. Admin paneline erişimi **engellenmiştir**. |

---

## 2. Yetki Matrisi (Permission Matrix)

| Yetki Alanı / Aksiyon | SUPER_ADMIN | ADMIN | CONTENT_EDITOR | APPLICATION_MANAGER | PROGRAM_MANAGER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Kullanıcı Yönetimi (Davet/Silme/Rol Değişimi)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Son Süper Admin Koruması** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Güvenlik Merkezi & Audit Logları** | ✅ | ✅ (Okuma) | ❌ | ❌ | ❌ | ❌ |
| **Sosyal Medya Hesap Bağlama (OAuth/API)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sosyal Medya Gelen Kutusu & Haber Dönüştürme**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Haber / Duyuru / Etkinlik CRUD** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Vaka Çalışmaları CRUD** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Girişimci Havuzu & Profil Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Başvuru İnceleme & Durum Değiştirme** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Program Yönetimi (ANTsPARK/ANTSFIRE)** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Mentör Havuzu & Eşleştirmeler** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **E-posta Şablonları & Outbox Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sistem Ayarları & Terminoloji** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Server-Side Güvenlik Kuralları

1. **İstemci Güvenilmezdir:** UI üzerinde buton veya menü gizlemek tek başına güvenlik değildir. Her API route, Server Action ve Servis çağrısında `getServerSession(authOptions)` üzerinden rol ve yetki doğrulaması yapılır.
2. **Privilege Escalation Koruması:** `ADMIN` rolündeki bir kullanıcı başka bir kullanıcıyı `SUPER_ADMIN` yapamaz veya diğer admin kullanıcılarını silemez.
3. **Admin Panel İzolasyonu:** `ENTREPRENEUR` ve `MENTOR` kullanıcılarının `/admin/*` yollarına erişimi middleware ve server route katmanında 403 ile engellenir.
4. **Audit Trail:** Tüm kritik CRUD, yetki değişimi, davet ve sosyal medya işlemleri `AuditLog` tablosuna değişen alanlar, IP adresi ve kullanıcı bilgisiyle kaydedilir.
