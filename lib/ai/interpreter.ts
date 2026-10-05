import { prisma } from '@/lib/prisma';
import { istanbulDayKey } from '@/lib/time';
import type { AiContext } from './types';

/**
 * Deterministic Turkish command interpreter. Maps a prompt to a registered action id and
 * a candidate input. Inputs are always validated again by the action's zod schema.
 * Missing required information produces a clarification instead of an invented value.
 */
export type Interpretation =
    | { kind: 'action'; actionId: string; input: Record<string, unknown> }
    | { kind: 'clarify'; message: string; suggestions?: string[] }
    | { kind: 'none' };

const lc = (s: string) => s.toLocaleLowerCase('tr');
const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w));

const MONTHS = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];

/** Extracts a YYYY-MM-DD day from Turkish expressions (bugün, yarın, 12.10.2026, 12 ekim). */
export function parseDay(text: string, now = new Date()): string | null {
    const t = lc(text);
    const offset = (days: number) => istanbulDayKey(new Date(now.getTime() + days * 86400000));
    if (/\böbür gün\b|\bertesi gün\b/.test(t)) return offset(2);
    if (t.includes('yarın')) return offset(1);
    if (t.includes('bugün')) return offset(0);
    const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) return iso[0];
    const dotted = t.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/);
    if (dotted) return `${dotted[3]}-${dotted[2].padStart(2, '0')}-${dotted[1].padStart(2, '0')}`;
    const named = t.match(new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS.join('|')})(?:\\s+(\\d{4}))?`));
    if (named) {
        const currentYear = Number(istanbulDayKey(now).slice(0, 4));
        const month = MONTHS.indexOf(named[2]) + 1;
        let year = named[3] ? Number(named[3]) : currentYear;
        const candidate = `${year}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`;
        if (!named[3] && candidate < istanbulDayKey(now)) year += 1;
        return `${year}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`;
    }
    return null;
}

export function parseTimeRange(text: string): { startTime: string; endTime: string } | null {
    const norm = (h: string, m?: string) => `${h.padStart(2, '0')}:${m || '00'}`;
    const m = text.match(/\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:-|–|—|ile|ila|'?(?:den|dan|ten|tan))\s*([01]?\d|2[0-3])(?:[:.]([0-5]\d))?/i);
    if (!m) return null;
    return { startTime: norm(m[1], m[2]), endTime: norm(m[3], m[4]) };
}

const quoted = (text: string): string | null => {
    const m = text.match(/["“”'‘’]([^"“”'‘’]{2,})["“”'‘’]/);
    return m ? m[1].trim() : null;
};

/** Words that identify forms, programs and campaigns in this institution. */
async function loadLexicon() {
    const [programs, campaigns, forms] = await Promise.all([
        prisma.program.findMany({ where: { isArchived: false }, select: { name: true, slug: true } }),
        prisma.applicationCampaign.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { name: true, applicationType: true } }),
        prisma.form.findMany({ where: { isArchived: false }, select: { title: true, slug: true } }),
    ]);
    // Short, distinctive tokens: "ANTSPARK", "ANTSFire", "Glow Up", "TEKMER"
    const keywords = new Set<string>();
    for (const p of programs) keywords.add(p.name.split(/\s+(?:Ön|Kuluçka|Hızlandırma|Programı|Ideathon)/i)[0]);
    for (const c of campaigns) if (c.applicationType === 'TEKMER') keywords.add('TEKMER');
    for (const f of forms) keywords.add(f.title);
    return { programs, keywords: Array.from(keywords).filter((k) => k.length >= 3) };
}

function findKeyword(text: string, keywords: string[]): string[] {
    const t = lc(text);
    return keywords.filter((k) => t.includes(lc(k))).sort((a, b) => t.indexOf(lc(a)) - t.indexOf(lc(b)));
}

function guessEntityName(prompt: string): string | null {
    const q = quoted(prompt);
    if (q) return q;
    // "ABC Teknoloji'nin", "ABC Girişim'i", "ABC'yi"
    const m = prompt.match(/([A-ZÇĞİÖŞÜ0-9][\wÇĞİÖŞÜçğıöşü&.-]*(?:\s+[A-ZÇĞİÖŞÜ0-9][\wÇĞİÖŞÜçğıöşü&.-]*){0,4})['’](?:n?[ıiuü]n|y?[ıiuü]|n?[ae]|d[ae]n)\b/);
    return m ? m[1].trim() : null;
}

export async function interpret(prompt: string, context: AiContext): Promise<Interpretation> {
    const text = prompt.trim();
    const t = lc(text);
    const lex = await loadLexicon();
    const inContext = (type: string) => context.entityType === type || context.lastEntity?.type === type;
    const refersToContext = /\b(bu|bunu|buna|bunun|bunlar|bunları|şunu|bu kaydı|bu kişiye|bu şirkete|bu girişime)\b/.test(t);

    // ---- Daily briefing
    if (has(t, 'bugünkü işlerim', 'bugün ne yapmalıyım', 'görevlerim', 'işlerim neler', 'bugün neler var')) {
        return { kind: 'action', actionId: 'tasks.today', input: { scope: 'today' } };
    }
    if (has(t, 'geciken görev', 'gecikmiş görev')) return { kind: 'action', actionId: 'tasks.today', input: { scope: 'overdue' } };

    // ---- Applications
    if (has(t, 'başvuru') && has(t, 'bekleyen', 'sonuçlanmamış', 'açık başvuru', 'değerlendirilmemiş')) {
        const type = has(t, 'tekmer', 'yer edinme') ? 'TEKMER' : has(t, 'program') ? 'PROGRAM' : 'ALL';
        return { kind: 'action', actionId: 'applications.pending', input: { type } };
    }
    const stageWords = ['değerlendirmeye al', 'kabul et', 'reddet', 'mülakata al', 'mülakata çağır', 'ön incelemeye al', 'jüriye al', 'beklemeye al', 'eksik evrak'];
    const stageHit = stageWords.find((w) => t.includes(w));
    if (stageHit && (has(t, 'başvuru') || inContext('Application'))) {
        const ref = text.match(/\b([A-Z]{2,5}-\d{4}-\d{3,8})\b/i)?.[1] || null;
        if (!ref && !inContext('Application')) return { kind: 'clarify', message: 'Hangi başvuru? Başvuru detay sayfasında komut verin veya başvuru numarasını yazın (ör. PRG-2026-00012).' };
        const stage = stageHit.startsWith('değerlendir') ? 'değerlendir' : stageHit.startsWith('kabul') ? 'kabul' : stageHit.startsWith('reddet') ? 'red' : stageHit.startsWith('mülakat') ? 'mülakat' : stageHit.startsWith('ön inceleme') ? 'ön inceleme' : stageHit.startsWith('jüri') ? 'jüri' : stageHit.startsWith('bekleme') ? 'bekleme' : 'eksik';
        return { kind: 'action', actionId: 'application.change_stage', input: { application: ref, stage } };
    }

    // ---- Finance
    if (has(t, 'kira') && has(t, 'öde', 'tahsil', 'kaydet', 'dekont') && !has(t, 'geciken', 'göster', 'listele')) {
        const amountMatch = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,(\d{1,2}))?\s*(tl|try|₺|lira|bin)/i);
        const entrepreneur = guessEntityName(text) || (inContext('Entrepreneur') ? context.lastEntity?.label || null : null);
        if (!amountMatch) return { kind: 'clarify', message: 'Ödeme tutarını belirtin (ör. "ABC Teknoloji\'nin 24.000 TL kira ödemesini kaydet").' };
        if (!entrepreneur) return { kind: 'clarify', message: 'Hangi girişimin ödemesi? Girişim adını yazın.' };
        let amount = Number(amountMatch[1].replace(/[.\s]/g, '')) + (amountMatch[2] ? Number(`0.${amountMatch[2]}`) : 0);
        if (lc(amountMatch[3]) === 'bin') amount *= 1000;
        const method = has(t, 'nakit') ? 'CASH' : has(t, 'kredi kart') ? 'CREDIT_CARD' : 'BANK_TRANSFER';
        return { kind: 'action', actionId: 'rent.recordPayment', input: { entrepreneur, amount, paymentMethod: method } };
    }
    if (has(t, 'geciken kira', 'gecikmiş kira', 'kira gecik', 'ödenmemiş kira')) return { kind: 'action', actionId: 'rent.overdue', input: {} };
    if (has(t, 'sözleşme') && has(t, 'bitecek', 'biten', 'sona erecek', 'süresi dolacak')) {
        const days = Number(t.match(/(\d+)\s*gün/)?.[1] || 30);
        return { kind: 'action', actionId: 'contracts.expiring', input: { days } };
    }

    // ---- Facilities & reservations
    if (has(t, '3d', '360', '3 boyut')) {
        if (has(t, 'olmayan', 'eksik', 'yok')) return { kind: 'action', actionId: 'facilities.experience', input: { has3D: false } };
        if (has(t, 'olan', 'bulunan', 'mevcut', 'var')) return { kind: 'action', actionId: 'facilities.experience', input: { has3D: true } };
    }
    if (has(t, 'müsait', 'boş alan', 'uygun alan', 'hangi alan')) {
        const date = parseDay(text);
        const range = parseTimeRange(text);
        const people = Number(t.match(/(\d+)\s*kişi/)?.[1] || 0);
        const missing = [!date && 'tarih', !range && 'saat aralığı', !people && 'kişi sayısı'].filter(Boolean);
        if (missing.length) return { kind: 'clarify', message: `Müsaitlik için ${missing.join(', ')} gerekli. Örnek: "Yarın 14:00–16:00 arasında 8 kişi için hangi alanlar müsait?"` };
        return { kind: 'action', actionId: 'reservations.availability', input: { date, ...range, participants: people } };
    }

    // ---- Forms
    if (has(t, 'form') || has(t, 'soru')) {
        const found = findKeyword(text, lex.keywords);
        const formRef = found[0] || (inContext('Form') ? '' : null);
        if (has(t, 'fark', 'karşılaştır')) {
            if (found.length >= 2) return { kind: 'action', actionId: 'forms.compare', input: { formA: found[0], formB: found[1] } };
            if (has(t, 'program') && has(t, 'tekmer')) {
                const programForm = lex.keywords.find((k) => /antspark/i.test(k)) || 'ANTSPARK';
                return { kind: 'action', actionId: 'forms.compare', input: { formA: programForm, formB: 'TEKMER' } };
            }
            return { kind: 'clarify', message: 'Karşılaştırılacak iki formu yazın (ör. "ANTSPARK ve TEKMER formlarının farklarını göster").' };
        }
        if (has(t, 'soru') && has(t, 'ekle')) {
            const label = quoted(text);
            if (!label) return { kind: 'clarify', message: 'Eklenecek soruyu tırnak içinde yazın: ANTSPARK formuna "Ekibinizde kaç kadın girişimci var?" sorusunu taslak olarak ekle' };
            if (formRef === null) return { kind: 'clarify', message: 'Hangi forma eklensin? Form adını yazın veya form sayfasında komut verin.' };
            const fieldType = has(t, 'sayı', 'kaç ') && !has(t, 'metin') ? 'NUMBER' : has(t, 'evet/hayır', 'evet hayır') ? 'RADIO' : 'TEXT';
            return { kind: 'action', actionId: 'form.add_draft_question', input: { form: formRef || '', label, fieldType, required: has(t, 'zorunlu') } };
        }
        if (has(t, 'kullanıldığı', 'nerede kullan', 'nerelerde')) {
            if (formRef === null) return { kind: 'clarify', message: 'Hangi form? Form adını yazın.' };
            return { kind: 'action', actionId: 'forms.where_used', input: { form: formRef || '' } };
        }
        if (has(t, 'soru')) {
            if (formRef === null) return { kind: 'clarify', message: 'Hangi formun soruları? Form adını yazın (ör. "ANTSPARK formundaki soruları göster").' };
            return { kind: 'action', actionId: 'forms.questions', input: { form: formRef || '', requiredOnly: has(t, 'zorunlu') } };
        }
    }

    // ---- Programs
    if (has(t, 'programı olmayan', 'programsız', 'programa atanmamış')) return { kind: 'action', actionId: 'entrepreneurs.without_program', input: {} };
    if (/\b(ata|atansın|kaydet)\b/.test(t) && (has(t, 'program') || lex.programs.some((p) => t.includes(lc(p.name.split(' ')[0]))))) {
        const program = lex.programs.find((p) => t.includes(lc(p.name.split(' ')[0])) || t.includes(lc(p.slug)));
        if (!program) return { kind: 'clarify', message: `Hangi program? Seçenekler: ${lex.programs.map((p) => p.name).join(', ')}` };
        const entrepreneur = refersToContext || inContext('Entrepreneur') ? null : guessEntityName(text.replace(new RegExp(program.name.split(' ')[0], 'i'), ''));
        if (!entrepreneur && !inContext('Entrepreneur')) return { kind: 'clarify', message: 'Hangi girişim? Girişim sayfasında komut verin veya adını tırnak içinde yazın.' };
        const cohort = text.match(/\b(\d{4}[-/][\wÇĞİÖŞÜçğıöşü0-9]+)\s*dönem/i)?.[1] || null;
        return { kind: 'action', actionId: 'program.assign', input: { entrepreneur, program: program.name.split(' ')[0], cohort } };
    }
    if (has(t, 'programları listele', 'programlar', 'kampanya istatistik', 'program istatistik')) return { kind: 'action', actionId: 'programs.overview', input: {} };

    // ---- Tasks
    if (has(t, 'görev') && has(t, 'oluştur', 'aç', 'ekle')) {
        const day = parseDay(text);
        const title = quoted(text) || (refersToContext && context.lastEntity ? `${context.lastEntity.label} takibi` : null) || text.replace(/\b(için|bir|yeni|görev(i)?|oluştur|aç|ekle|yarın|bugün|bunun|buna|bu)\b/gi, ' ').replace(/\s+/g, ' ').trim();
        if (!title || title.length < 3) return { kind: 'clarify', message: 'Görev başlığını yazın (ör. "Yarın \'ABC ile teklif görüşmesi\' görevi oluştur").' };
        const priority = has(t, 'acil') ? 'URGENT' : has(t, 'önemli', 'yüksek öncelik') ? 'HIGH' : 'MEDIUM';
        return { kind: 'action', actionId: 'task.create', input: { title: title.slice(0, 200), dueDate: day, priority } };
    }

    // ---- Email
    if (has(t, 'taslağı gönder', 'maili gönder', 'e-postayı gönder') && context.lastEntity?.type === 'EmailDraft') {
        return { kind: 'action', actionId: 'email.send_draft', input: { draftId: context.lastEntity.id } };
    }
    if (has(t, 'mail', 'e-posta', 'eposta') && has(t, 'hazırla', 'yaz', 'taslak')) {
        const to = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || null;
        const topic = has(t, 'toplantı') ? 'Toplantı Daveti' : has(t, 'teşekkür') ? 'Teşekkürler' : has(t, 'hatırlat') ? 'Hatırlatma' : quoted(text) || 'Bilgilendirme';
        const greeting = context.lastEntity && ['Person', 'Organization', 'Entrepreneur'].includes(context.lastEntity.type) ? `Sayın ${context.lastEntity.label},` : 'Merhaba,';
        const body = topic === 'Toplantı Daveti'
            ? `${greeting}\n\nİKÜANTS TEKMER olarak sizinle bir toplantı planlamak istiyoruz. Uygun olduğunuz gün ve saatleri paylaşabilir misiniz?\n\nSaygılarımızla,\nİKÜANTS TEKMER`
            : `${greeting}\n\n[Mesaj metnini buraya yazın]\n\nSaygılarımızla,\nİKÜANTS TEKMER`;
        return { kind: 'action', actionId: 'email.prepare', input: { to, subject: topic, body } };
    }

    // ---- CMS
    if (has(t, 'banner', 'hero')) {
        const title = text.match(/başlığ[ıi]\s*[:\-]?\s*["“']?(.+?)["”']?\s*(?:olsun|olarak|$)/i)?.[1]?.trim() || quoted(text) || text.split(':')[1]?.trim();
        if (!title) return { kind: 'clarify', message: 'Banner başlığını yazın (ör. Ana sayfaya "Yeni dönem başvuruları açıldı" başlıklı banner ekle).' };
        return { kind: 'action', actionId: 'cms.banner.create', input: { title: title.slice(0, 200), mediaUrl: context.lastEntity?.type === 'Media' ? context.lastEntity.label : null } };
    }
    if (has(t, 'haber') && has(t, 'taslak', 'hazırla', 'yaz')) {
        const title = quoted(text);
        if (!title) return { kind: 'clarify', message: 'Haber başlığını tırnak içinde yazın. İçeriği "içerik:" sonrasına ekleyebilirsiniz.' };
        const content = text.split(/içerik\s*:/i)[1]?.trim() || title;
        return { kind: 'action', actionId: 'cms.news_draft', input: { title, content } };
    }

    // ---- Users
    if (has(t, 'kullanıcı', 'davet') && has(t, 'oluştur', 'davet', 'ekle', 'aç')) {
        const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
        if (!email) return { kind: 'clarify', message: 'Kullanıcının e-posta adresini yazın (ör. "Ayşe Demir için ayse@ornek.com adresiyle editör kullanıcısı oluştur").' };
        const name = text.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)\s+(?:için|adında|isimli)/)?.[1] || text.match(/adı\s+["“']?([^"”',]+)/i)?.[1]?.trim();
        if (!name) return { kind: 'clarify', message: 'Kullanıcının adını ve soyadını yazın.' };
        const roleSlug = has(t, 'süper') ? 'super-admin' : has(t, 'editör', 'editor', 'içerik') ? 'content-editor' : has(t, 'finans') ? 'finance-manager' : has(t, 'başvuru yönet') ? 'application-manager' : has(t, 'program yönet') ? 'program-manager' : has(t, 'yönetici', 'admin') ? 'admin' : has(t, 'izleyici', 'viewer') ? 'viewer' : null;
        if (!roleSlug) return { kind: 'clarify', message: 'Hangi rol verilsin? (editör, finans, başvuru yöneticisi, program yöneticisi, yönetici, izleyici)' };
        return { kind: 'action', actionId: 'user.invite', input: { name, email, roleSlug } };
    }

    // ---- Reports
    if (has(t, 'rapor') && has(t, 'günlük', 'bugün')) return { kind: 'action', actionId: 'report.daily', input: { date: parseDay(text) } };

    // ---- Daily work log ("Bugün ABC ile görüştüm, yarın arayacağım")
    if (has(t, 'görüştüm', 'görüştük', 'toplantı yaptık', 'toplantı yaptım', 'konuştuk', 'ziyaret ettim')) {
        return { kind: 'action', actionId: 'multi.dailyWork', input: parseDailyWork(text) };
    }

    // ---- CRM lookup & navigation
    const openMatch = text.match(/^(.+?)['’]?(?:y?[ıiuü]|n?[ıiuü]n kaydını)\s+(?:aç|göster|bul)\s*$/i) || text.match(/^(.+?)\s+kim\??$/i);
    if (openMatch && !has(t, 'sayfa', 'merkez', 'modül', 'ekran')) {
        const q = openMatch[1].replace(/['’]$/, '').trim();
        if (q.length >= 2) return { kind: 'action', actionId: 'crm.find', input: { query: q } };
    }
    if (/\b(aç|git|göster)\b/.test(t)) return { kind: 'action', actionId: 'navigate', input: { target: text } };

    return { kind: 'none' };
}

/** Splits a free-text work log into interactions and follow-up tasks. Never invents names. */
export function parseDailyWork(text: string) {
    const sentences = text.split(/[\n.;]+|,\s*(?=(?:yarın|sonra|ayrıca|ve)\b)/i).map((s) => s.trim()).filter((s) => s.length > 3);
    const interactions: { contactName: string; subject: string; notes: string; followUpDate: string | null }[] = [];
    const tasks: { title: string; description: string; dueDate: string | null; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }[] = [];
    for (const s of sentences) {
        const t = lc(s);
        if (has(t, 'görüştüm', 'görüştük', 'toplantı', 'konuştuk', 'ziyaret')) {
            const who = s.match(/([A-ZÇĞİÖŞÜ][\wçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][\wçğıöşü]+)*)\s*(?:ile|'(?:y?l[ae])|’(?:y?l[ae]))/);
            interactions.push({ contactName: who ? who[1] : 'Belirtilmedi', subject: s.slice(0, 200), notes: s, followUpDate: null });
        } else if (has(t, 'arayacağım', 'göndereceğim', 'takip', 'kontrol', 'yapacağım', 'hazırlayacağım', 'görev')) {
            tasks.push({ title: s.replace(/^(ve|ayrıca|sonra)\s+/i, '').slice(0, 200), description: s, dueDate: parseDay(s), priority: has(t, 'acil') ? 'URGENT' : 'MEDIUM' });
        }
    }
    return { interactions, tasks };
}
