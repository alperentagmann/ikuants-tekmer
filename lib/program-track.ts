/**
 * Tracks an entrepreneur can be placed in. Programs come from the Program table;
 * TEKMER yer edinme and "other" are not Program rows, so the assignment stores
 * programId = null and the name in programLabel.
 */
export const PLACEMENT_TRACK_LABEL = 'TEKMER Yer Edinme';
export const TRACK_PLACEMENT = '__placement__';
export const TRACK_OTHER = '__other__';

/** Programs listed first in the selector, in this order (matched by slug prefix). */
export const PRIMARY_PROGRAM_SLUGS = ['antspark', 'antsfire'];

export type TrackProgram = { id: string; name: string; slug?: string | null };

/** Selector options: Yer Edinme, ANTSPARK, ANTSFire, other programs, Diğer. */
export function trackOptions(programs: TrackProgram[]) {
    const rank = (p: TrackProgram) => {
        const i = PRIMARY_PROGRAM_SLUGS.findIndex((s) => (p.slug || '').startsWith(s));
        return i === -1 ? PRIMARY_PROGRAM_SLUGS.length : i;
    };
    const sorted = [...programs].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'tr'));
    return [
        { value: TRACK_PLACEMENT, label: PLACEMENT_TRACK_LABEL },
        ...sorted.map((p) => ({ value: p.id, label: p.name })),
        { value: TRACK_OTHER, label: 'Diğer (elle yazın)' },
    ];
}

/** Turns a selector value (+ free text for "Diğer") into what the API stores. */
export function trackToAssignment(value: string, otherText?: string): { programId: string | null; programLabel: string | null } {
    if (value === TRACK_PLACEMENT) return { programId: null, programLabel: PLACEMENT_TRACK_LABEL };
    if (value === TRACK_OTHER) return { programId: null, programLabel: (otherText || '').trim() || null };
    return { programId: value || null, programLabel: null };
}

/** Display name of an assignment, whether it points to a Program or not. */
export function assignmentLabel(a: { program?: { name?: string | null } | null; programLabel?: string | null }): string {
    return a.program?.name || a.programLabel || 'Program belirtilmemiş';
}
