import { redirect } from 'next/navigation';

/** Templates are managed in the email center (Templates tab). */
export default function EmailTemplatesRedirect() {
    redirect('/admin/eposta-merkezi?tab=templates');
}
