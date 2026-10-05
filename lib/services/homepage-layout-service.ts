import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { defaultLayout, sanitizeLayout, type HomeLayout, type PageKey } from '@/lib/homepage-layout';

/**
 * Page layouts (design studio): published version, draft and version history per page.
 * Stored in SiteSetting. The homepage keeps its original keys for compatibility.
 */
const HISTORY_LIMIT = 20;

type Actor = { id: string; name: string; email: string };

function keys(page: PageKey) {
    if (page === 'home') return { published: 'homepage_layout', draft: 'homepage_layout_draft', history: 'homepage_layout_history' };
    return { published: `page_layout:${page}`, draft: `page_layout_draft:${page}`, history: `page_layout_history:${page}` };
}

async function read(key: string, page: PageKey): Promise<HomeLayout | null> {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row) return null;
    try {
        const parsed = JSON.parse(row.value);
        return { ...sanitizeLayout(parsed, page), updatedAt: parsed.updatedAt, updatedBy: parsed.updatedBy };
    } catch {
        return null;
    }
}

async function write(key: string, value: unknown, isPublic: boolean) {
    const json = JSON.stringify(value);
    await prisma.siteSetting.upsert({ where: { key }, update: { value: json, isPublic }, create: { key, value: json, group: 'PAGE_LAYOUT', isPublic, description: 'Sayfa tasarım düzeni' } });
}

async function readHistory(page: PageKey): Promise<{ layout: HomeLayout; publishedAt: string; publishedBy: string | null }[]> {
    const row = await prisma.siteSetting.findUnique({ where: { key: keys(page).history } });
    if (!row) return [];
    try {
        const list = JSON.parse(row.value);
        return Array.isArray(list) ? list.map((h) => ({ layout: sanitizeLayout(h.layout, page), publishedAt: String(h.publishedAt || ''), publishedBy: h.publishedBy || null })) : [];
    } catch {
        return [];
    }
}

export const PageLayoutService = {
    async getPublished(page: PageKey): Promise<HomeLayout> {
        try {
            return (await read(keys(page).published, page)) || defaultLayout(page);
        } catch {
            return defaultLayout(page);
        }
    },

    async getDraft(page: PageKey): Promise<HomeLayout> {
        return (await read(keys(page).draft, page)) || (await this.getPublished(page));
    },

    /** Draft when previewing as an editor, published otherwise. */
    async forRequest(page: PageKey, preview: boolean): Promise<HomeLayout> {
        return preview ? this.getDraft(page) : this.getPublished(page);
    },

    async getEditorState(page: PageKey) {
        const k = keys(page);
        const [published, draft, history] = await Promise.all([read(k.published, page), read(k.draft, page), readHistory(page)]);
        const base = published || defaultLayout(page);
        return { published: base, draft: draft || base, hasDraft: Boolean(draft), history: history.map((h, index) => ({ index, publishedAt: h.publishedAt, publishedBy: h.publishedBy, blockCount: h.layout.blocks.length, preset: h.layout.theme.preset })) };
    },

    async saveDraft(page: PageKey, input: unknown, actor: Actor) {
        const layout = { ...sanitizeLayout(input, page), updatedAt: new Date().toISOString(), updatedBy: actor.name };
        await write(keys(page).draft, layout, false);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'PageLayout', entityId: keys(page).draft, newValues: { page, blocks: layout.blocks.map((b) => b.type), preset: layout.theme.preset } });
        return layout;
    },

    async publish(page: PageKey, actor: Actor) {
        const k = keys(page);
        const draft = await read(k.draft, page);
        if (!draft) throw new DomainError('Yayınlanacak taslak yok. Önce taslağı kaydedin.');
        const current = await read(k.published, page);
        const history = await readHistory(page);
        if (current) history.unshift({ layout: current, publishedAt: new Date().toISOString(), publishedBy: actor.name });
        await write(k.history, history.slice(0, HISTORY_LIMIT), false);
        await write(k.published, { ...draft, updatedAt: new Date().toISOString(), updatedBy: actor.name }, true);
        await prisma.siteSetting.deleteMany({ where: { key: k.draft } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'PUBLISH', entityType: 'PageLayout', entityId: k.published, oldValues: current ? { blocks: current.blocks.map((b) => b.type) } : null, newValues: { page, blocks: draft.blocks.map((b) => b.type), preset: draft.theme.preset } });
        return draft;
    },

    async discardDraft(page: PageKey, actor: Actor) {
        await prisma.siteSetting.deleteMany({ where: { key: keys(page).draft } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'PageLayout', entityId: keys(page).draft, diff: `${page} taslağı silindi` });
    },

    /** Loads an earlier published version (or the original design) into the draft. */
    async restoreToDraft(page: PageKey, source: 'original' | number, actor: Actor) {
        let layout: HomeLayout;
        if (source === 'original') layout = defaultLayout(page);
        else {
            const history = await readHistory(page);
            if (!history[source]) throw new DomainError('Sürüm bulunamadı.', 404);
            layout = history[source].layout;
        }
        return this.saveDraft(page, layout, actor);
    },
};

/** Homepage shortcuts kept for existing callers. */
export const HomepageLayoutService = {
    getPublished: () => PageLayoutService.getPublished('home'),
    getDraft: () => PageLayoutService.getDraft('home'),
    getEditorState: () => PageLayoutService.getEditorState('home'),
    saveDraft: (input: unknown, actor: Actor) => PageLayoutService.saveDraft('home', input, actor),
    publish: (actor: Actor) => PageLayoutService.publish('home', actor),
    discardDraft: (actor: Actor) => PageLayoutService.discardDraft('home', actor),
    restoreToDraft: (source: 'original' | number, actor: Actor) => PageLayoutService.restoreToDraft('home', source, actor),
};
