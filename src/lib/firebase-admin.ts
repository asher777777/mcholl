import { initializeApp, getApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let app: any;
let adminDb: any;
let adminAuth: any;
let adminStorage: any;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
    let privateKey = "";
    
    if (privateKeyB64) {
      privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "c-g-ltd";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "c-g-ltd.firebasestorage.app";

    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
        storageBucket,
      });
    } else {
      // In production Cloud Functions environment, initialize using default credentials
      app = initializeApp({
        projectId,
        storageBucket
      });
    }
  }

  adminDb = getFirestore(app, "default");
  adminAuth = getAuth(app);
  adminStorage = getStorage(app);
} catch (error) {
  console.error("CRITICAL: Failed to initialize Firebase Admin:", error);
  
  // Provide a fallback mock so the app doesn't throw a 500 error on import
  // The layout will detect dbActive=false instead of crashing the page.
  const mockDb = {
    collection: () => mockDb,
    where: () => mockDb,
    limit: () => mockDb,
    get: async () => ({ docs: [], size: 0, empty: true }),
    doc: () => ({
      get: async () => ({ exists: false, data: () => ({}) }),
      set: async () => ({}),
      delete: async () => ({})
    })
  };
  
  adminDb = mockDb;
  adminAuth = {};
  adminStorage = { bucket: () => ({ file: () => ({ save: async () => {}, getSignedUrl: async () => [""] }) }) };
}

export { adminDb, adminAuth, adminStorage };
