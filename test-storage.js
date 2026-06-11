const fs = require('fs');
const admin = require('firebase-admin');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: Buffer.from(env.FIREBASE_ADMIN_PRIVATE_KEY_B64, 'base64').toString('utf8')
  })
});

async function test() {
  try {
    const [buckets] = await admin.storage().getBuckets();
    console.log('Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));
  } catch (e) {
    console.log('Error listing buckets:', e.message);
  }
}
test();
