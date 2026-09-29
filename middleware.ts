import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // ------------------------------------------------------------------------
    // 1. Security Headers (Item 91)
    // ------------------------------------------------------------------------
    const cspHeader = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "font-src 'self' https: data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), browsing-topics=()'
    );

    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );
    }

    // ------------------------------------------------------------------------
    // 2. CSRF / Origin Validation for State-Changing Requests (Item 80)
    // ------------------------------------------------------------------------
    const method = request.method.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const pathname = request.nextUrl.pathname;

    if (isMutation && pathname.startsWith('/api/admin/')) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');

        if (origin && host) {
            try {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    return NextResponse.json(
                        { success: false, error: 'CSRF Origin doğrulaması başarısız.' },
                        { status: 403 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Geçersiz istek kaynağı (Origin).' },
                    { status: 403 }
                );
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for static files:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images/assets (.png, .jpg, .svg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
