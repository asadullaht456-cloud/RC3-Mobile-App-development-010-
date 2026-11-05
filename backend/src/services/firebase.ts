import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : null;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized successfully with service account');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.applicationDefault()
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized with application default credentials');
  } else {
    console.warn('⚠️ Firebase service account not found. Firebase Admin is in dev standby mode.');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Firebase Admin:', error);
}

export const firebaseAdmin = admin;
export const isFirebaseInitialized = () => firebaseInitialized;
