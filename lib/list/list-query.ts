/**
 * Ortak liste ekranı sorgusu: arama, filtre, sıralama, sayfalama.
 * Hem API (sunucu) hem birim testleri kullanır; Prisma'ya bağımlı değildir.
 *
 * Küçük/orta hacimli listeler (bina, bölüm, poliçe…) hesaplanan sütunlarla (ör. "dolu" durumu)
 * birlikte sıralanabildiği için bellekte işlenir. Büyük hacimli listeler (PDKS) veritabanında sayfalar.
 */

export type SortDir = 'asc' | 'desc';

export type ListParams = {
    q: string;
    sort: string | null;
    dir: SortDir;
    page: number;
    pageSize: number;
    filters: Record<string, string>;
    includeArchived: boolean;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

export function parseListParams(sp: URLSearchParams, opts: { filterKeys?: string[]; sortable?: string[] } = {}): ListParams {
    const sort = sp.get('sort');
    const pageSize = Number(sp.get('pageSize'));
    const page = Number(sp.get('page'));
    const filters: Record<string, string> = {};
    for (const key of opts.filterKeys ?? []) {
        const v = sp.get(key)?.trim();
        if (v) filters[key] = v;
    }
    return {
        q: (sp.get('q') ?? '').trim().slice(0, 200),
        sort: sort && (!opts.sortable || opts.sortable.includes(sort)) ? sort : null,
        dir: sp.get('dir') === 'desc' ? 'desc' : 'asc',
        page: Number.isInteger(page) && page > 0 ? page : 1,
        pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
        filters,
        includeArchived: sp.get('archived') === '1',
    };
}

/** Türkçe duyarlı küçük harfe çevirme (İ/I sorunları için). */
export const trLower = (s: string) => s.toLocaleLowerCase('tr-TR');

type Sortable = string | number | Date | boolean | null | undefined;

export function compareValues(a: Sortable, b: Sortable): number {
    // Boş değerler her iki yönde de sona gider
    const aEmpty = a === null || a === undefined || a === '';
    const bEmpty = b === null || b === undefined || b === '';
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    if (a instanceof Date || b instanceof Date) return +new Date(a as Date) - +new Date(b as Date);
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return String(a).localeCompare(String(b), 'tr', { numeric: true, sensitivity: 'base' });
}

export type ListResult<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number };

/**
 * Arama → sıralama → sayfalama. `search` arama metnini içeren alanları, `sortValue` sütun anahtarına göre
 * sıralama değerini verir. `paginate: false` dışa aktarma içindir (tüm filtrelenmiş satırlar).
 */
export function applyList<T>(
    rows: T[],
    p: ListParams,
    opts: { search: (row: T) => Array<string | null | undefined>; sortValue: (row: T, key: string) => Sortable; defaultSort?: { key: string; dir: SortDir }; paginate?: boolean },
): ListResult<T> {
    const needle = trLower(p.q);
    let out = needle ? rows.filter((r) => opts.search(r).some((v) => v && trLower(v).includes(needle))) : rows.slice();
    const sortKey = p.sort ?? opts.defaultSort?.key ?? null;
    const dir = p.sort ? p.dir : opts.defaultSort?.dir ?? 'asc';
    if (sortKey) {
        const sign = dir === 'desc' ? -1 : 1;
        out = out
            .map((row, i) => ({ row, i, v: opts.sortValue(row, sortKey) }))
            .sort((x, y) => {
                const xe = x.v === null || x.v === undefined || x.v === '';
                const ye = y.v === null || y.v === undefined || y.v === '';
                if (xe !== ye) return xe ? 1 : -1; // boşlar her yönde sonda
                return sign * compareValues(x.v, y.v) || x.i - y.i; // kararlı sıralama
            })
            .map((x) => x.row);
    }
    const total = out.length;
    if (opts.paginate === false) return { items: out, total, page: 1, pageSize: total, pageCount: 1 };
    const pageCount = Math.max(1, Math.ceil(total / p.pageSize));
    const page = Math.min(p.page, pageCount);
    return { items: out.slice((page - 1) * p.pageSize, page * p.pageSize), total, page, pageSize: p.pageSize, pageCount };
}
