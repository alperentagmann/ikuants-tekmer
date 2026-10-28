/**
 * Koddaki her izin denetimi (hasPermission / requireAdmin / requirePermission / can / nav `perm`) lib/rbac.ts
 * kataloğunda tanımlı mı? Tanımsız izin Roller ekranında görünmez, kimseye verilemez ve yetkili kullanıcıyı da reddeder.
 *
 *   npx tsx scripts/qa/check-permissions.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from '../../lib/rbac';

export function findUnknownPermissions(root = process.cwd()) {
    const known = new Set([
        ...SYSTEM_PERMISSIONS.map((p) => `${p.action}:${p.resource}`),
        ...DEFAULT_ROLES.flatMap((r) => r.permissions.map((p) => `${p.action}:${p.resource}`)),
    ]);
    const files: string[] = [];
    const walk = (d: string) => {
        for (const f of readdirSync(d)) {
            const p = join(d, f);
            if (statSync(p).isDirectory()) { if (!['node_modules', '.next'].includes(f)) walk(p); }
            else if (/\.(ts|tsx)$/.test(f)) files.push(p);
        }
    };
    for (const d of ['app', 'lib', 'components']) walk(join(root, d));
    const q = `['"]`;
    const patterns = [
        new RegExp(`(?:hasPermission\\([^,()]+,\\s*|requireAdmin\\([^,()]+,\\s*|requirePermission\\([^,()]+,\\s*|\\bcan\\()${q}([\\w*]+)${q}\\s*,\\s*${q}([\\w*]+)${q}`, 'g'),
        new RegExp(`perm:\\s*${q}([\\w*]+):([\\w*]+)${q}`, 'g'),
    ];
    const unknown = new Map<string, string[]>();
    for (const f of files) {
        const s = readFileSync(f, 'utf8');
        for (const re of patterns) for (const m of s.matchAll(re)) {
            const key = `${m[1]}:${m[2]}`;
            if (m[1] === '*' || known.has(key)) continue;
            unknown.set(key, [...new Set([...(unknown.get(key) ?? []), f.replace(root, '').replace(/\\/g, '/')])]);
        }
    }
    return { checkedFiles: files.length, unknown };
}

if (process.argv[1]?.includes('check-permissions')) {
    const r = findUnknownPermissions();
    for (const [k, v] of r.unknown) console.log(k, '->', v.slice(0, 4).join(', '));
    console.log('checked files:', r.checkedFiles, 'unknown permission keys:', r.unknown.size);
    process.exitCode = r.unknown.size ? 1 : 0;
}
