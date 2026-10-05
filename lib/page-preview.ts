import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

/**
 * Draft preview is shown only to signed-in editors (?onizleme=1). Inside the design studio
 * canvas (?studio=1) sections are additionally selectable.
 */
export async function previewMode(sp: { onizleme?: string; studio?: string }): Promise<{ preview: boolean; studio: boolean }> {
    if (sp.onizleme !== '1') return { preview: false, studio: false };
    const user = await getCurrentAdminUser().catch(() => null);
    const preview = Boolean(user && hasPermission(user, 'edit', 'cms'));
    return { preview, studio: preview && sp.studio === '1' };
}
