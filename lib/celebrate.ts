/** Fired after a public form or request was stored successfully; the site shows a celebration. */
export const FORM_SUCCESS_EVENT = 'ikuants:form-success';

export interface FormSuccessDetail {
    reference?: string | null;
    message?: string | null;
}

export function celebrate(detail: FormSuccessDetail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<FormSuccessDetail>(FORM_SUCCESS_EVENT, { detail }));
}
