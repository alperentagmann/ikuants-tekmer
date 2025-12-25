import { NextRequest, NextResponse } from 'next/server';
import { sendMail, generateEmailTemplate } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, ...formData } = body;

        let subject = 'Yeni İletişim Formu Mesajı';
        let title = 'Yeni Mesaj Alındı';

        // Determine email subject and title based on form type
        switch (type) {
            case 'meeting':
                subject = `Toplantı Talebi: ${formData.topic || 'Belirtilmemiş'}`;
                title = '📅 Yeni Toplantı Talebi';
                break;
            case 'visit':
                subject = `Ziyaret Talebi: ${formData.company || formData.name}`;
                title = '🏢 Yeni Ziyaret Talebi';
                break;
            case 'message':
                subject = `İletişim Mesajı: ${formData.name}`;
                title = '✉️ Yeni İletişim Mesajı';
                break;
            default:
                break;
        }

        // Generate HTML content
        const html = generateEmailTemplate(title, formData);

        // Send email
        const result = await sendMail({
            to: 'bilgi@ikuantstekmer.com',
            subject: subject,
            html: html,
            replyTo: formData.email
        });

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Form başarıyla gönderildi.' });
        } else {
            console.error('Email sending failed:', result.error);
            // Even if email fails, we might want to return success to the user if we saved it proactively
            // But for now, let's return error so they know it didn't go through
            return NextResponse.json(
                { success: false, message: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Bir sunucu hatası oluştu.' },
            { status: 500 }
        );
    }
}
