import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location') || 'HEADER';

        const menuItems = await prisma.menuItem.findMany({
            where: {
                menuLocation: location,
                parentId: null,
                isActive: true,
            },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json({ success: true, menuItems });
    } catch {
        return NextResponse.json({ success: true, menuItems: [] });
    }
}
