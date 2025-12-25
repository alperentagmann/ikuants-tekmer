import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.json();

        // Log the form data (this will appear in the server console)
        console.log('='.repeat(50));
        console.log('YENİ BAŞVURU ALINDI');
        console.log('='.repeat(50));
        console.log('Proje Adı:', formData.projectName);
        console.log('Ad Soyad:', formData.fullName);
        console.log('E-posta:', formData.email);
        console.log('Telefon:', formData.phone);
        console.log('Görev:', formData.projectRole);
        console.log('Sektör:', formData.sectors);
        console.log('Proje Özeti:', formData.projectSummary);
        console.log('='.repeat(50));

        // Email sending would go here
        // For now, we'll simulate a successful submission
        // To enable email, you can:
        // 1. Use Nodemailer with SMTP (requires email server config)
        // 2. Use a service like SendGrid, Resend, or EmailJS

        // Example email configuration (commented out - needs server setup):
        /*
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: 'smtp.example.com',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        await transporter.sendMail({
            from: 'noreply@ikuantstekmer.com',
            to: 'bilgi@ikuantstekmer.com',
            subject: `Yeni Başvuru: ${formData.projectName}`,
            html: `
                <h2>Yeni TEKMER Başvurusu</h2>
                <p><strong>Proje:</strong> ${formData.projectName}</p>
                <p><strong>İsim:</strong> ${formData.fullName}</p>
                <p><strong>E-posta:</strong> ${formData.email}</p>
                <p><strong>Telefon:</strong> ${formData.phone}</p>
                <p><strong>Özet:</strong> ${formData.projectSummary}</p>
            `
        });
        */

        return NextResponse.json({
            success: true,
            message: 'Başvurunuz başarıyla alındı!'
        });
    } catch (error) {
        console.error('Form submission error:', error);
        return NextResponse.json(
            { success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
            { status: 500 }
        );
    }
}
