process.env.LC_ALL = 'C';
process.env.LANG = 'C';
process.env.LC_CTYPE = 'C';
process.env.PGLOCALE = 'C';

import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

async function start() {
    const dataDir = path.resolve(process.cwd(), '.embedded-postgres');
    console.log('🚀 Starting Embedded PostgreSQL on port 5432...');
    console.log('📁 Data directory:', dataDir);

    const pg = new EmbeddedPostgres({
        databaseDir: dataDir,
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        persistent: true,
        initdbFlags: ['--locale=C', '--encoding=UTF8'],
    });

    await pg.initialise();
    await pg.start();

    // Create database if not exists
    try {
        await pg.createDatabase('ikuants_tekmer');
        console.log('✅ Database "ikuants_tekmer" created/ready.');
    } catch {
        console.log('ℹ️ Database "ikuants_tekmer" already exists.');
    }

    console.log('🎉 Embedded PostgreSQL is running on localhost:5432!');
}

start().catch((err) => {
    console.error('❌ Embedded Postgres Error:', err);
});
