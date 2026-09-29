import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user) return NextResponse.json({ success: false }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const q = searchParams.get('q')?.trim();

        if (!q) {
            return NextResponse.json({ success: true, results: [] });
        }

        const [mentors, entrepreneurs, news, programs, applications] = await Promise.all([
            prisma.mentor.findMany({
                where: {
                    OR: [
                        { name: { contains: q } },
                        { surname: { contains: q } },
                        { company: { contains: q } },
                    ],
                    isArchived: false,
                },
                take: 4,
            }),
            prisma.entrepreneur.findMany({
                where: {
                    OR: [
                        { name: { contains: q } },
                        { sector: { contains: q } },
                    ],
                    isArchived: false,
                },
                take: 4,
            }),
            prisma.news.findMany({
                where: {
                    OR: [
                        { title: { contains: q } },
                        { excerpt: { contains: q } },
                    ],
                    isArchived: false,
                },
                take: 4,
            }),
            prisma.program.findMany({
                where: {
                    name: { contains: q },
                    isArchived: false,
                },
                take: 3,
            }),
            prisma.application.findMany({
                where: {
                    OR: [
                        { applicationNumber: { contains: q } },
                        { applicantName: { contains: q } },
                        { companyName: { contains: q } },
                    ],
                },
                take: 4,
            }),
        ]);

        const results: any[] = [];

        mentors.forEach((m: any) => {
            results.push({
                id: m.id,
                title: `${m.name} ${m.surname} (${m.company})`,
                category: 'Mentör',
                url: `/admin/mentorler?id=${m.id}`,
            });
        });

        entrepreneurs.forEach((e: any) => {
            results.push({
                id: e.id,
                title: `${e.name} (${e.sector})`,
                category: 'Girişimci',
                url: `/admin/girisimciler?id=${e.id}`,
            });
        });

        news.forEach((n: any) => {
            results.push({
                id: n.id,
                title: n.title,
                category: 'Haber/Duyuru',
                url: `/admin/haberler?id=${n.id}`,
            });
        });

        programs.forEach((p: any) => {
            results.push({
                id: p.id,
                title: p.name,
                category: 'Program',
                url: `/admin/programlar?id=${p.id}`,
            });
        });

        applications.forEach((a: any) => {
            results.push({
                id: a.id,
                title: `${a.applicationNumber} — ${a.applicantName} (${a.companyName || 'Bireysel'})`,
                category: 'Başvuru',
                url: `/admin/basvurular/${a.id}`,
            });
        });

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error('Search error:', e);
        return NextResponse.json({ success: false, results: [] });
    }
}
