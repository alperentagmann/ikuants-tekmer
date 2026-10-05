import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';
import { AccountingService, EXPENSE_CATEGORIES, INCOME_CATEGORIES, MOVEMENT_KINDS, VAT_RATES, WITHHOLDING_RATES } from '@/lib/services/accounting-service';

/** GET ?view=summary|parties|accounts|movements|invoices|invoice|statement */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'finance');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const view = sp.get('view') || 'summary';
        const perms = {
            create: auth.user.isSuperAdmin || hasPermission(auth.user, 'create', 'finance'),
            update: auth.user.isSuperAdmin || hasPermission(auth.user, 'update', 'finance'),
            approve: auth.user.isSuperAdmin || hasPermission(auth.user, 'approve', 'finance'),
        };
        switch (view) {
            case 'summary':
                return NextResponse.json({ success: true, summary: await AccountingService.summary(Number(sp.get('year')) || new Date().getFullYear()), perms, meta: { vatRates: VAT_RATES, withholdingRates: WITHHOLDING_RATES, movementKinds: MOVEMENT_KINDS, expenseCategories: EXPENSE_CATEGORIES, incomeCategories: INCOME_CATEGORIES } });
            case 'parties':
                return NextResponse.json({ success: true, parties: await AccountingService.listParties(sp.get('search') || undefined) });
            case 'accounts':
                return NextResponse.json({ success: true, accounts: await AccountingService.listAccounts() });
            case 'movements':
                return NextResponse.json({ success: true, movements: await AccountingService.listMovements({ accountId: sp.get('accountId') || undefined, partyId: sp.get('partyId') || undefined, kind: sp.get('kind') || undefined, from: sp.get('from') || undefined, to: sp.get('to') || undefined }) });
            case 'invoices':
                return NextResponse.json({ success: true, invoices: await AccountingService.listInvoices({ status: sp.get('status') || undefined, partyId: sp.get('partyId') || undefined, search: sp.get('search') || undefined }) });
            case 'invoice':
                return NextResponse.json({ success: true, invoice: await AccountingService.getInvoice(sp.get('id') || '') });
            case 'statement':
                return NextResponse.json({ success: true, ...(await AccountingService.statement(sp.get('partyId') || '')) });
            default:
                return NextResponse.json({ success: false, message: 'Geçersiz görünüm' }, { status: 400 });
        }
    } catch (error) {
        return errorResponse(error, 'Muhasebe verisi alınamadı');
    }
}

/** POST { action: save_party | save_account | add_movement | delete_movement | save_invoice | issue_invoice | cancel_invoice, ... } */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'finance');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as Record<string, unknown> & { action?: string; id?: string };
        const id = typeof body.id === 'string' ? body.id : '';
        switch (body.action) {
            case 'save_party':
                return NextResponse.json({ success: true, party: await AccountingService.saveParty(body, auth.user) });
            case 'save_account':
                return NextResponse.json({ success: true, account: await AccountingService.saveAccount(body, auth.user) });
            case 'add_movement':
                return NextResponse.json({ success: true, movement: await AccountingService.addMovement(body, auth.user) });
            case 'delete_movement':
                await AccountingService.deleteMovement(id, auth.user);
                return NextResponse.json({ success: true });
            case 'save_invoice':
                return NextResponse.json({ success: true, ...(await AccountingService.saveDraft(body, auth.user)) });
            case 'issue_invoice':
                return NextResponse.json({ success: true, invoice: await AccountingService.issue(id, auth.user) });
            case 'cancel_invoice':
                await AccountingService.cancel(id, String(body.reason || ''), auth.user);
                return NextResponse.json({ success: true });
            default:
                return NextResponse.json({ success: false, message: 'Geçersiz işlem' }, { status: 400 });
        }
    } catch (error) {
        return errorResponse(error, 'Muhasebe işlemi başarısız');
    }
}
