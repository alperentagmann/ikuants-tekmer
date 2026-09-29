async function testLoginAndApis() {
    console.log('=== TESTING LIVE HTTP ENDPOINTS ===\n');

    // 1. Test Super Admin Login: bilgi@ikuantstekmer.com
    console.log('[1] Testing Super Admin Login: bilgi@ikuantstekmer.com');
    const adminPass = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || 'TestPassword123!';
    const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bilgi@ikuantstekmer.com', password: adminPass }),
    });
    const loginData = await loginRes.json();
    console.log('  Status:', loginRes.status);
    console.log('  Response:', loginData);
    if (loginData.success && loginData.user?.email === 'bilgi@ikuantstekmer.com') {
        console.log('  ✅ Super Admin Login: PASS');
    } else {
        console.error('  ❌ Super Admin Login: FAIL');
    }

    // 2. Test Legacy Admin Login: admin@ikuantstekmer.com
    console.log('\n[2] Testing Legacy Admin Login (Should be rejected / inactive): admin@ikuantstekmer.com');
    const legacyLoginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@ikuantstekmer.com', password: 'AdminTekmer2026!' }),
    });
    const legacyData = await legacyLoginRes.json();
    console.log('  Status:', legacyLoginRes.status);
    console.log('  Response:', legacyData);
    if (!legacyData.success) {
        console.log('  ✅ Legacy Admin Login Blocked: PASS');
    } else {
        console.error('  ❌ Legacy Admin Login not blocked: FAIL');
    }

    // 3. Test Public Mentors API
    console.log('\n[3] Testing Public Mentors API: /api/public/mentors');
    const mentorsRes = await fetch('http://localhost:3000/api/public/mentors');
    const mentorsData = await mentorsRes.json();
    console.log('  Status:', mentorsRes.status);
    console.log(`  Mentors Count: ${mentorsData.mentors?.length || 0}`);
    if (mentorsData.success && mentorsData.mentors?.length === 22) {
        console.log('  ✅ Public Mentors (22 in DB): PASS');
    } else {
        console.error('  ❌ Public Mentors: FAIL');
    }

    // 4. Test Public Entrepreneurs API
    console.log('\n[4] Testing Public Entrepreneurs API: /api/public/entrepreneurs');
    const entRes = await fetch('http://localhost:3000/api/public/entrepreneurs');
    const entData = await entRes.json();
    console.log('  Status:', entRes.status);
    console.log(`  Public Entrepreneurs Count: ${entData.entrepreneurs?.length || 0}`);
    if (entData.success && entData.entrepreneurs?.length === 19) {
        console.log('  ✅ Public Entrepreneurs (19 published in DB): PASS');
    } else {
        console.error('  ❌ Public Entrepreneurs: FAIL');
    }

    console.log('\n=== HTTP TESTS COMPLETE ===');
}

testLoginAndApis().catch(console.error);
