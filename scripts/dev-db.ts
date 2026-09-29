process.env.LC_ALL = 'C';
process.env.LANG = 'C';
process.env.LC_CTYPE = 'C';
process.env.PGLOCALE = 'C';

import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import net from 'net';

function isPortOpen(port: number, host: string = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function main() {
    const isRunning = await isPortOpen(5432);
    if (isRunning) {
        console.log('✅ PostgreSQL is already running and listening on localhost:5432.');
        return;
    }

    const dataDir = path.resolve(process.cwd(), '.embedded-postgres');
    console.log('🚀 Launching Embedded PostgreSQL Database Server (Port 5432)...');
    console.log('📁 Data Directory:', dataDir);

    const pg = new EmbeddedPostgres({
        databaseDir: dataDir,
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        persistent: true,
        initdbFlags: ['--locale=C', '--encoding=UTF8'],
    });

    try {
        await pg.initialise();
    } catch {
        // Already initialized
    }

    await pg.start();

    try {
        await pg.createDatabase('ikuants_tekmer');
        console.log('✅ Database "ikuants_tekmer" created.');
    } catch {
        // Already exists
    }

    console.log('🎉 Embedded PostgreSQL is running on localhost:5432 and ready for connections!\n');

    // Keep process alive if run directly
    await new Promise(() => { });
}

main().catch((err) => {
    console.error('❌ Failed to start embedded postgres:', err);
});
