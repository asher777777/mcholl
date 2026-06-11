import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Parse .env.local manually
const envPath = path.resolve('.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envConfig[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const privateKeyBase64 = envConfig.FIREBASE_ADMIN_PRIVATE_KEY_B64;
if (!privateKeyBase64) {
  console.error("No FIREBASE_ADMIN_PRIVATE_KEY_B64 found in .env.local");
  process.exit(1);
}

const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

if (!admin.apps.length) {
  console.log("Initializing admin with project ID:", envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: envConfig.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

const globalSettings = {
  siteLogoUrl: "/logo.png",
  headerLayout: "classic",
  theme: "charcoal",
  navLinks: [
    { name: "בית", href: "/" },
    { name: "עמודי נחיתה", href: "/landing-pages" },
    { name: "שירותים", href: "/services-pages" },
    { name: "תוכן ו-SEO", href: "/content-pages" },
    { name: "צור קשר", href: "/contact" },
  ],
  contactPhone: "054-000-0000",
  contactEmail: "info@community-generator.co.il",
  contactFacebook: "https://www.facebook.com/",
  contactAddress: "רחוב החדשנות 1, אזור ההייטק",
  updatedAt: new Date().toISOString()
};

async function updateSettings() {
  await db.collection("settings").doc("global").set(globalSettings, { merge: true });
  console.log("Global settings FORCE UPDATED in Firestore!");
}

updateSettings().catch(console.error);
