import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// No dotenv

async function test() {
  try {
    const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
    let privateKey = "";
    if (privateKeyB64) {
      privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    }
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "c-g-ltd";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    console.log("Initializing app...", { projectId, clientEmail, hasKey: !!privateKey });
    let app;
    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else {
      app = initializeApp({ projectId });
    }

    const db = getFirestore(app, "default");
    console.log("Testing collection get...");
    const snap = await db.collection("configs").limit(1).get();
    console.log("Success! Docs:", snap.size);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
