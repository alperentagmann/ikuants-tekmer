import { NextRequest, NextResponse } from 'next/server';
import { sendMail, generateEmailTemplate } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.json();

        // Log to console for debugging
        console.log('YENİ BAŞVURU:', formData.programName || "ANTSPARK", formData.projectName);

        const programName = formData.programName || "ANTSPARK";
        let emailData = {};

        if (programName === "ANTSFire") {
            emailData = {
                'Program': programName,
                // Şirket
                'Şirket Adı': formData.companyName,
                'Vergi No': formData.taxNumber,
                'Kuruluş Yılı': formData.foundationYear,
                'Sektör': formData.sector,
                'Kümeler': formData.tekmerClusters?.join(", "),
                'Çalışan Sayısı': formData.employeeCount,
                'Web Sitesi': formData.website,
                // Kurucu
                'Kurucu': formData.founderName,
                'İletişim': formData.founderContact,
                'Rol': formData.founderRole,
                'Haftalık Zaman': formData.weeklyHours,
                // Ürün
                'Ürün Tanımı': formData.productShortDesc,
                'Problem': formData.problemDefinition,
                'Farklılık': formData.solutionDifference,
                'TRL': formData.trlLevel,
                'Demo Linki': formData.demoLink,
                'Ar-Ge Özeti': formData.randdProjectSummary,
                // Pazar
                'Hedef Müşteri': formData.targetCustomer,
                'Pazar Büyüklüğü': formData.marketSize,
                'Rakipler': formData.competitors,
                'GTM Planı': formData.gtmPlan,
                // Finans
                'Pilot/LOI': formData.hasPilot,
                'Gelir': formData.revenueStatus,
                'Runway': formData.runway,
                'Yatırım Geçmişi': formData.investmentHistory,
                'Finansal Özet': formData.financialSummary,
                // Dosyalar
                'Pitch Deck': formData.pitchDeckLink,
                'CVler': formData.founderCvLink,
                // İhtiyaç
                'Darboğazlar': formData.bottlenecks,
                'Hedefler': formData.goals,
                'Modüller': formData.selectedModules?.join(", ")
            };
        } else {
            // Default ANTSPARK or General Application fields
            emailData = {
                'Program': formData.programName || "İKÜANTS TEKMER Başvuru",
                // Kişisel / Şirket Bilgileri
                'Şirket Var Mı?': formData.hasCompany,
                'Ad Soyad / Firma İsmi': formData.fullName,
                'Doğum Tarihi': formData.birthDate,
                'E-Posta': formData.email,
                'Telefon': formData.phone,
                'Vergi Numarası': formData.taxNumber || 'Belirtilmedi',
                'Nace Kodu': formData.naceCode || 'Belirtilmedi',
                'TEKMER Dışı Adres': formData.companyAddress || 'Belirtilmedi',

                // Proje Bilgileri
                'Proje Adı': formData.projectName,
                'Proje Özeti': formData.projectSummary,
                'Ekip / Kurucu Bilgisi': formData.teamInfo,
                'Proje Teması': formData.projectTheme,
                'Gelişmeye Katkı': formData.projectContribution,
                'Mevcut Ürünlerden Farkı': formData.projectDifference,
                'Çıktılar ve Kullanım Alanları': formData.projectOutputs,

                // Pazar ve Finansal Bilgiler
                'Hedef Müşteri ve Pazar': formData.targetMarket,
                'Faaliyet/Zaman Planlaması': formData.projectTimeline,
                'Ölçeklenebilirlik / Ticarileşme': formData.scalability,

                // Beklenti ve İhtiyaçlar
                'Beklentiler (Neden TEKMER?)': formData.expectations,
                'Fiziksel Alan Talebi': formData.workspacePreference,
                'Talep Edilen Süre': formData.requestedDuration,
                'AR-GE Niteliği': formData.argeQuality,
                'Sunum Dosyası': formData.presentationLink
            };
        }

        const html = generateEmailTemplate(`🚀 Yeni ${programName} Başvurusu`, emailData);

        // Send email
        const result = await sendMail({
            to: 'bilgi@ikuantstekmer.com',
            subject: `${programName} Başvurusu: ${formData.companyName || formData.projectName}`,
            html: html,
            replyTo: formData.email || formData.founderContact
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Başvurunuz başarıyla alındı ve e-posta gönderildi!'
            });
        } else {
            console.error('Application email failed:', result.error);
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
