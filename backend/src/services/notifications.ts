import { db } from '../db/connection.js';
import { firebaseAdmin, isFirebaseInitialized } from './firebase.js';

let lastAlertedBudgetStatus: string | null = null;

export async function sendNotificationToMembers(
  memberIds: string[],
  title: string,
  body: string,
  data: { type: string; screen: string; reference_id?: string }
): Promise<void> {
  if (memberIds.length === 0) return;

  try {
    const placeholders = memberIds.map(() => '?').join(',');
    const tokensStmt = db.prepare(
      `SELECT token, member_id FROM device_tokens WHERE member_id IN (${placeholders})`
    );
    const rows = tokensStmt.all(...memberIds) as { token: string; member_id: string }[];

    if (rows.length === 0) {
      console.log(`ℹ️ [Push Notification] No tokens registered for members: ${memberIds.join(', ')}`);
      return;
    }

    if (!isFirebaseInitialized()) {
      console.log(`ℹ️ [Push Notification Log (Dev Standby)]: To ${memberIds.join(', ')}: "${title} - ${body}"`);
      return;
    }

    for (const { token } of rows) {
      try {
        await firebaseAdmin.messaging().send({
          token,
          notification: { title, body },
          data,
        });
      } catch (err: any) {
        if (
          err?.code === 'messaging/registration-token-not-registered' ||
          err?.code === 'messaging/invalid-registration-token'
        ) {
          console.log(`🗑️ Removing invalid FCM token: ${token}`);
          db.prepare('DELETE FROM device_tokens WHERE token = ?').run(token);
        } else {
          console.warn('⚠️ FCM send error:', err?.message || err);
        }
      }
    }
  } catch (err) {
    // Fire-and-forget: Never break main HTTP response
    console.error('❌ Notification service error:', err);
  }
}

export async function checkAndSendBudgetAlert(
  currentStatus: 'Safe' | 'Near Limit' | 'Exceeded',
  spentPercentage: number
): Promise<void> {
  if (currentStatus === 'Safe') {
    lastAlertedBudgetStatus = 'Safe';
    return;
  }

  // Only alert when status changes
  if (currentStatus !== lastAlertedBudgetStatus) {
    lastAlertedBudgetStatus = currentStatus;

    const allMembers = db.prepare('SELECT id FROM members').all() as { id: string }[];
    const memberIds = allMembers.map((m) => m.id);

    const title = 'Budget Alert';
    const body = `Household spending reached ${spentPercentage}% (${currentStatus})`;

    await sendNotificationToMembers(memberIds, title, body, {
      type: 'BUDGET_ALERT',
      screen: 'Home',
    });
  }
}
