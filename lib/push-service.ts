import { adminMessaging } from "@/lib/firebaseAdmin";
import { getPushTokens } from "@/lib/firestore-service";

/**
 * Sends a push notification to every device the user has registered. Silently does nothing
 * if the user has no registered tokens yet (e.g. they haven't granted notification
 * permission) or if FCM isn't configured — this is a best-effort side channel and should
 * never be the reason a request handler fails.
 */
export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<{ sent: number; failed: number }> {
  const tokens = await getPushTokens(userId);
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  try {
    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
    return { sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    // Don't let a notification failure break the caller's main workflow (e.g. a risk scan).
    console.error("Push notification failed:", error);
    return { sent: 0, failed: tokens.length };
  }
}
