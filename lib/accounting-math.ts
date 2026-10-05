/** Pure pre-accounting helpers shared by the server and the invoice editor. */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const VAT_RATES = [0, 1, 10, 20];
/** KDV tevkifatı (withholding) ratios used on Turkish invoices: 0 or 2/10 … 10/10. */
export const WITHHOLDING_RATES = [0, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1];
export const MOVEMENT_KINDS: Record<string, { label: string; sign: 1 | -1 }> = {
    COLLECTION: { label: 'Tahsilat', sign: 1 },
    INCOME: { label: 'Diğer gelir', sign: 1 },
    TRANSFER_IN: { label: 'Virman (giriş)', sign: 1 },
    PAYMENT: { label: 'Ödeme', sign: -1 },
    EXPENSE: { label: 'Gider', sign: -1 },
    TRANSFER_OUT: { label: 'Virman (çıkış)', sign: -1 },
};
export const EXPENSE_CATEGORIES = ['Kira', 'Personel', 'Vergi & SGK', 'Fatura (elektrik, su, internet)', 'Hizmet alımı', 'Malzeme & demirbaş', 'Etkinlik', 'Seyahat', 'Banka masrafı', 'Diğer'];
export const INCOME_CATEGORIES = ['Kira', 'Hizmet', 'Makine kullanımı', 'Etkinlik', 'Sponsorluk', 'Hibe / destek', 'Faiz', 'Diğer'];

export interface InvoiceLineInput {
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountRate?: number;
    vatRate: number;
}

/** Line and invoice totals (net = qty × price − discount; VAT on net; withholding on VAT). */
export function computeInvoice(lines: InvoiceLineInput[], withholdingRate = 0) {
    const computed = lines.map((l, i) => {
        const gross = round2(l.quantity * l.unitPrice);
        const discount = round2(gross * ((l.discountRate || 0) / 100));
        const net = round2(gross - discount);
        const vat = round2(net * (l.vatRate / 100));
        return { description: l.description.trim(), quantity: l.quantity, unit: l.unit?.trim() || 'Adet', unitPrice: l.unitPrice, discountRate: l.discountRate || 0, vatRate: l.vatRate, lineNet: net, vatAmount: vat, sortOrder: i, gross, discount };
    });
    const subtotal = round2(computed.reduce((a, l) => a + l.gross, 0));
    const discountTotal = round2(computed.reduce((a, l) => a + l.discount, 0));
    const net = round2(subtotal - discountTotal);
    const vatTotal = round2(computed.reduce((a, l) => a + l.vatAmount, 0));
    const withholdingTotal = round2(vatTotal * withholdingRate);
    const grandTotal = round2(net + vatTotal - withholdingTotal);
    return { lines: computed.map(({ gross: _g, discount: _d, ...rest }) => rest), subtotal, discountTotal, vatTotal, withholdingTotal, grandTotal, net };
}

