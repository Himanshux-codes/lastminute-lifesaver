"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "@/lib/firebase";

export async function requestPushToken(): Promise<string | null> {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  return token || null;
}
