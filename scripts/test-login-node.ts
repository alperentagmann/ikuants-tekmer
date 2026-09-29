async function run() {
    const email = process.argv[2] || 'bilgi@ikuantstekmer.com';
    const password = process.argv[3] || process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
    const res = await fetch('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response JSON:', data);
}

run().catch(console.error);
