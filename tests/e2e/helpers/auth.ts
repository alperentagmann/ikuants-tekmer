import { prisma } from '../../../lib/prisma';
import { createSession } from '../../../lib/auth';
import type { BrowserContext } from '@playwright/test';

export async function loginAsAdmin(context: BrowserContext, email = 'bilgi@ikuantstekmer.com') {
    const user = await prisma.user.findFirst({
        where: { email },
    });
    if (!user) {
        throw new Error(`Admin user ${email} not found in database.`);
    }
    const { sessionToken } = await createSession(user.id, '127.0.0.1', 'Playwright Test Agent');
    await context.addCookies([
        {
            name: '__session',
            value: sessionToken,
            url: 'http://localhost:3000',
        },
    ]);
    return { user, sessionToken };
}
