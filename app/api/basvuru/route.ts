import { NextRequest, NextResponse } from 'next/server';
import { sendMail, generateEmailTemplate } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.json();

        // Log to console for debugging
        console.log('YENİ BAŞVURU:', formData.projectName);

        // Prepare email content
        // We select key fields to show in the email table to avoid an overly long email
        // but we can include everything if needed. For now, let's include key info.
        const emailData = {
            'Proje Adı': formData.projectName,
            'Ad Soyad': formData.fullName,
            'E-Posta': formData.email,
            'Telefon': formData.phone,
            'Görev': formData.projectRole,
            'Sektör': formData.sectors,
            'Proje Özeti': formData.projectSummary,
            'Aşama': formData.projectStage,
            'MVP Durumu': formData.hasMVP,
            'Ekip Büyüklüğü': formData.teamSize
        };

        const html = generateEmailTemplate('🚀 Yeni ANTSPARK Başvurusu', emailData);

        // Send email
        const result = await sendMail({
            to: 'bilgi@ikuantstekmer.com',
            subject: `ANTSPARK Başvurusu: ${formData.projectName}`,
            html: html,
            replyTo: formData.email
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Başvurunuz başarıyla alındı ve e-posta gönderildi!'
            });
        } else {
            // If email fails, we log it but still might return false to warn the user
            console.error('Application email failed:', result.error);

            // In a real production app, we should save to DB first, so email failure isn't critical.
            // Since we don't have a DB here, we must rely on email.
            return NextResponse.json({
                success: false,
                message: 'Başvuru alındı ancak e-posta gönderilemedi. Lütfen iletişime geçin.'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Form submission error:', error);
        return NextResponse.json(
            { success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
            { status: 500 }
        );
    }
}
