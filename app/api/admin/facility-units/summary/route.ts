import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';
import { ParameterService } from '@/lib/services/parameter-service';

/** Alan yönetimi özeti: doluluk, bitişi yaklaşan poliçeler, sözleşmesi bağlanmamış aktif tahsisler. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const warn = await ParameterService.getNumber('ALERTS', 'expiry_warning_days');
        const [occupancy, expiringPolicies, unlinked] = await Promise.all([
            FacilityUnitService.occupancySummary(),
            FacilityUnitService.expiringPolicies(warn.value),
            FacilityUnitService.unlinkedActiveAssignments(),
        ]);
        return NextResponse.json({ success: true, summary: { occupancy, expiringPolicies, expiryWarningDays: warn, unlinkedActiveAssignments: unlinked } });
    } catch (error) {
        return errorResponse(error, 'Özet alınamadı');
    }
}
