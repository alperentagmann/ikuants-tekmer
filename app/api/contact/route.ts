import { NextResponse } from 'next/server';

/**
 * Retired endpoint. Public forms are managed in Admin > Form Merkezi and submit to
 * /api/public/forms/[slug]/submit, which validates against the published form version.
 */
export async function POST() {
    return NextResponse.json(
        {
            success: false,
            message: 'Bu uç nokta kullanımdan kaldırıldı. Formlar /api/public/forms/{form-adresi}/submit üzerinden gönderilir.',
        },
        { status: 410 }
    );
}
