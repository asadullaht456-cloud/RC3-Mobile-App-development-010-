import { Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { firebaseAdmin, isFirebaseInitialized } from '../services/firebase.js';
import { AuthenticatedRequest, Member } from '../types/index.js';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let email: string | null = null;
  let uid: string | null = null;

  if (isFirebaseInitialized()) {
    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(token);
      email = decoded.email || null;
      uid = decoded.uid;
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired Firebase token' });
      return;
    }
  } else {
    // Dev/Mock mode fallback when testing without live Firebase project credentials
    if (token === 'mock_firebase_id_token' || token === 'M01' || token.includes('ali')) {
      email = 'ali@demo.com';
      uid = 'mock_uid_ali';
    } else if (token === 'M02' || token.includes('ayesha')) {
      email = 'ayesha@demo.com';
      uid = 'mock_uid_ayesha';
    } else if (token === 'M03' || token.includes('bilal')) {
      email = 'bilal@demo.com';
      uid = 'mock_uid_bilal';
    } else if (token.includes('@')) {
      email = token;
      uid = `mock_uid_${token.split('@')[0]}`;
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  }

  if (!email) {
    res.status(401).json({ error: 'No email associated with token' });
    return;
  }

  // Find member in SQLite
  const stmt = db.prepare('SELECT * FROM members WHERE LOWER(email) = LOWER(?)');
  const member = stmt.get(email) as Member | undefined;

  if (!member) {
    res.status(403).json({ error: 'Authenticated user is not an active household member' });
    return;
  }

  // Update firebase_uid on first login if not set
  if (!member.firebase_uid && uid) {
    db.prepare('UPDATE members SET firebase_uid = ? WHERE id = ?').run(uid, member.id);
    member.firebase_uid = uid;
  }

  req.member = member;
  next();
}
