import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/application-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

/**
 * Post-acceptance actions (always explicit, never automatic):
 *   assignProgram         -> Program application: create EntrepreneurProgram
 *   startSpaceAssignment  -> TEKMER application: create a PLANNED SpaceAssignment
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();

        if (body.action === 'assignProgram') {
            const result = await ApplicationService.assignAcceptedToProgram({
                applicationId: id,
                entrepreneurId: body.entrepreneurId,
                newEntrepreneur: body.newEntrepreneur,
                programId: body.programId,
                cohort: body.cohort,
                actor: auth.actor,
            });
            return NextResponse.json({
                success: true,
                result,
                message: result.alreadyAssigned ? 'Girişim bu programa zaten atanmıştı.' : 'Programa atandı.',
                links: { entrepreneur: `/admin/girisimciler/${result.entrepreneurId}` },
            });
        }

        if (body.action === 'startSpaceAssignment') {
            const assignment = await ApplicationService.startSpaceAssignment({
                applicationId: id,
                facilityId: body.facilityId,
                organizationId: body.organizationId,
                newOrganization: body.newOrganization,
                entrepreneurId: body.entrepreneurId,
                unitLabel: body.unitLabel,
                startDate: body.startDate,
                notes: body.notes,
                actor: auth.actor,
            });
            return NextResponse.json({
                success: true,
                assignment,
                message: 'Alan tahsis süreci başlatıldı (Planlandı).',
                links: { spaceAssignments: '/admin/alanlar?tab=tahsisler' },
            });
        }

        return NextResponse.json({ success: false, message: 'Bilinmeyen işlem' }, { status: 400 });
    } catch (error) {
        return errorResponse(error, 'İşlem tamamlanamadı');
    }
}
