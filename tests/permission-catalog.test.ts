/**
 * Koddaki izin denetimleri yetki kataloğunda tanımlı olmalı; aksi hâlde izin Roller ekranından verilemez
 * ve yetkili kullanıcı da reddedilir (ör. kira tahsilatında "edit:rent" ↔ katalogda "payment:rent").
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { findUnknownPermissions } from '../scripts/qa/check-permissions';

test('her izin denetimi yetki kataloğunda tanımlı', () => {
    const r = findUnknownPermissions();
    assert.ok(r.checkedFiles > 100);
    assert.deepStrictEqual(Object.fromEntries(r.unknown), {});
});
