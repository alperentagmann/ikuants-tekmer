/**
 * Integration Hub catalog. Each card describes how a connection is configured; nothing here
 * assumes a public API exists. Base URLs and credentials are entered when the institution or
 * vendor provides them (e.g. KOSGEB API access), so no endpoint is invented in code.
 */

export type AuthType = 'NONE' | 'API_KEY_HEADER' | 'BEARER' | 'BASIC' | 'QUERY_KEY';

export interface ProviderField {
    key: string;
    label: string;
    secret?: boolean;
    placeholder?: string;
    required?: boolean;
}

export interface ProviderDef {
    key: string;
    name: string;
    category: 'PUBLIC_AGENCY' | 'ACCOUNTING' | 'BANK' | 'MESSAGING' | 'PRODUCTIVITY' | 'CUSTOM';
    description: string;
    defaultAuth: AuthType;
    fields: ProviderField[];
    note?: string;
}

export const CATEGORY_LABELS: Record<ProviderDef['category'], string> = {
    PUBLIC_AGENCY: 'Kamu kurumları',
    ACCOUNTING: 'Muhasebe & e-Belge',
    BANK: 'Banka & ödeme',
    MESSAGING: 'Mesajlaşma & bildirim',
    PRODUCTIVITY: 'Ofis & iş birliği',
    CUSTOM: 'Özel bağlantı',
};

export const AUTH_LABELS: Record<AuthType, string> = {
    NONE: 'Kimlik doğrulama yok',
    API_KEY_HEADER: 'API anahtarı (başlık)',
    BEARER: 'Bearer token',
    BASIC: 'Kullanıcı adı / parola (Basic)',
    QUERY_KEY: 'API anahtarı (adres parametresi)',
};

const credential: ProviderField[] = [
    { key: 'apiKey', label: 'API anahtarı / token', secret: true },
    { key: 'username', label: 'Kullanıcı adı' },
    { key: 'password', label: 'Parola', secret: true },
];

export const PROVIDERS: ProviderDef[] = [
    { key: 'KOSGEB', name: 'KOSGEB', category: 'PUBLIC_AGENCY', description: 'KOSGEB destek ve başvuru süreçleri için veri alışverişi.', defaultAuth: 'BEARER', fields: credential, note: 'KOSGEB tarafından API erişimi verildiğinde servis adresini ve anahtarı girin.' },
    { key: 'TUBITAK', name: 'TÜBİTAK', category: 'PUBLIC_AGENCY', description: 'TÜBİTAK destek programları ve proje takibi.', defaultAuth: 'BEARER', fields: credential, note: 'Kurumdan alınan erişim bilgileriyle yapılandırılır.' },
    { key: 'SANAYI_BAKANLIGI', name: 'Sanayi ve Teknoloji Bakanlığı', category: 'PUBLIC_AGENCY', description: 'TEKMER / teknopark bildirimleri ve raporlamalar.', defaultAuth: 'BEARER', fields: credential },
    { key: 'GIB_EINVOICE', name: 'e-Fatura / e-Arşiv entegratörü', category: 'ACCOUNTING', description: 'Satış faturalarının GİB\'e özel entegratör üzerinden gönderilmesi.', defaultAuth: 'BASIC', fields: [...credential, { key: 'senderAlias', label: 'Gönderici etiketi (alias)' }], note: 'Anlaşmalı entegratörün (ör. özel entegratör firması) servis adresi ve kullanıcı bilgileri gerekir.' },
    { key: 'PARASUT', name: 'Paraşüt', category: 'ACCOUNTING', description: 'Ön muhasebe kayıtlarının Paraşüt\'e aktarılması.', defaultAuth: 'BEARER', fields: [...credential, { key: 'companyId', label: 'Firma numarası' }] },
    { key: 'LOGO', name: 'Logo', category: 'ACCOUNTING', description: 'Logo muhasebe yazılımı ile cari / fatura aktarımı.', defaultAuth: 'BASIC', fields: credential },
    { key: 'MIKRO', name: 'Mikro', category: 'ACCOUNTING', description: 'Mikro muhasebe yazılımı ile cari / fatura aktarımı.', defaultAuth: 'BASIC', fields: credential },
    { key: 'BANK', name: 'Banka (açık bankacılık)', category: 'BANK', description: 'Hesap hareketlerinin çekilmesi ve tahsilat eşleştirme.', defaultAuth: 'BEARER', fields: [...credential, { key: 'accountNo', label: 'Hesap / IBAN' }] },
    { key: 'SMS', name: 'SMS sağlayıcısı', category: 'MESSAGING', description: 'Başvuru, rezervasyon ve hatırlatma SMS\'leri.', defaultAuth: 'BASIC', fields: [...credential, { key: 'sender', label: 'Gönderici başlığı' }] },
    { key: 'SLACK', name: 'Slack', category: 'MESSAGING', description: 'Bildirimlerin Slack kanalına düşmesi (gelen webhook).', defaultAuth: 'NONE', fields: [] , note: 'Servis adresine Slack "Incoming Webhook" adresini girin.' },
    { key: 'TEAMS', name: 'Microsoft Teams', category: 'MESSAGING', description: 'Bildirimlerin Teams kanalına düşmesi (gelen webhook).', defaultAuth: 'NONE', fields: [], note: 'Servis adresine Teams kanal webhook adresini girin.' },
    { key: 'GOOGLE', name: 'Google Workspace', category: 'PRODUCTIVITY', description: 'Takvim ve doküman entegrasyonları.', defaultAuth: 'BEARER', fields: credential },
    { key: 'CUSTOM_REST', name: 'Özel REST API', category: 'CUSTOM', description: 'Herhangi bir kurum veya yazılımın REST servisine bağlantı.', defaultAuth: 'API_KEY_HEADER', fields: credential },
];

export const providerOf = (key: string) => PROVIDERS.find((p) => p.key === key) || null;

/** Events external systems can subscribe to (outgoing webhooks). */
export const WEBHOOK_EVENTS: Record<string, string> = {
    'application.created': 'Yeni başvuru',
    'contact.created': 'Yeni iletişim talebi',
    'form.submitted': 'Yeni form gönderimi',
    'reservation.created': 'Yeni rezervasyon talebi',
    'quote.requested': 'Makine fiyat teklifi talebi',
    'task.completed': 'Görev tamamlandı',
    'invoice.issued': 'Satış faturası kesildi',
};

/** Scopes an external system's API key can be granted (read-only, no personal identity data). */
export const API_SCOPES: Record<string, string> = {
    'applications:read': 'Başvuru listesi (numara, durum, kampanya)',
    'tasks:read': 'Görev listesi (başlık, durum, termin)',
    'reservations:read': 'Rezervasyon listesi (alan, zaman, durum)',
    'finance:read': 'Satış faturası özetleri',
};
