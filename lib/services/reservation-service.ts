/**
 * İKÜANTS TEKMER — Room & Resource Reservation Service
 * 
 * Manages physical resources (Meeting rooms, Training halls, VR Lab, Studio)
 * Conflict detection, attendance, agenda, and follow-up task generation.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { M365Service } from './m365-service';

export interface CreateReservationInput {
    resourceId: string;
    userId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    attendeeCount?: number;
    attendeeNotes?: string;
    agenda?: string;
    createTeamsMeeting?: boolean;
}

export class ReservationService {
    /**
     * Get all active resources
     */
    static async getResources() {
        return prisma.resource.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get reservations within a date range with conflict checks
     */
    static async getReservations(startDate: Date, endDate: Date) {
        return prisma.reservation.findMany({
            where: {
                startTime: { lte: endDate },
                endTime: { gte: startDate },
                status: { not: 'CANCELLED' },
            },
            include: {
                resource: true,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Check if a resource has time conflict
     */
    static async checkConflict(resourceId: string, startTime: Date, endTime: Date, excludeId?: string) {
        const conflicting = await prisma.reservation.findFirst({
            where: {
                resourceId,
                status: { not: 'CANCELLED' },
                id: excludeId ? { not: excludeId } : undefined,
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
            include: {
                resource: true,
                user: { select: { name: true } },
            },
        });

        return conflicting;
    }

    /**
     * Create reservation with optimistic conflict guard
     */
    static async createReservation(input: CreateReservationInput) {
        const conflict = await this.checkConflict(input.resourceId, input.startTime, input.endTime);
        if (conflict) {
            throw new Error(`Seçilen saat aralığında "${conflict.resource.name}" salonu ${conflict.user.name} tarafından rezerve edilmiştir.`);
        }

        let teamsMeetingUrl: string | undefined = undefined;
        if (input.createTeamsMeeting) {
            const teams = await M365Service.createTeamsMeeting({
                title: input.title,
                startTime: input.startTime,
                endTime: input.endTime,
                attendees: input.attendeeNotes ? input.attendeeNotes.split(',') : [],
            });
            teamsMeetingUrl = teams.joinUrl;
        }

        const reservation = await prisma.reservation.create({
            data: {
                resourceId: input.resourceId,
                userId: input.userId,
                title: input.title,
                startTime: input.startTime,
                endTime: input.endTime,
                attendeeCount: input.attendeeCount || 1,
                attendeeNotes: input.attendeeNotes,
                agenda: input.agenda,
                teamsMeetingUrl,
                status: 'CONFIRMED',
            },
            include: {
                resource: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        await logAuditEvent({
            actorId: input.userId,
            action: 'CREATE_RESERVATION',
            entityType: 'Reservation',
            entityId: reservation.id,
            diff: JSON.stringify({ resource: reservation.resource.name, start: input.startTime, end: input.endTime }),
        });

        return reservation;
    }

    /**
     * Update meeting minutes and follow-up tasks
     */
    static async updateMeetingNotes(id: string, userId: string, notes: string, followUpTasks?: string) {
        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                meetingNotes: notes,
                followUpTasks,
                status: 'COMPLETED',
            },
        });

        await logAuditEvent({
            actorId: userId,
            action: 'UPDATE_MEETING_MINUTES',
            entityType: 'Reservation',
            entityId: id,
            diff: 'Meeting notes & follow-up tasks recorded',
        });

        return updated;
    }

    /**
     * Cancel reservation
     */
    static async cancelReservation(id: string, userId: string, reason?: string) {
        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                meetingNotes: reason ? `İptal Nedeni: ${reason}` : undefined,
            },
        });

        await logAuditEvent({
            actorId: userId,
            action: 'CANCEL_RESERVATION',
            entityType: 'Reservation',
            entityId: id,
            diff: `Reservation cancelled. Reason: ${reason || 'N/A'}`,
        });

        return updated;
    }
}
