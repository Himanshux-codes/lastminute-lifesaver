importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// These must match the NEXT_PUBLIC_FIREBASE_* values in your .env.local exactly.
// They are safe to hardcode here: Firebase's client-side config is not a secret —
// it's already shipped in the browser bundle for every visitor.
firebase.initializeApp({
  apiKey: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Last-Minute Life Saver";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/icon-192.png",
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const taskId = event.notification.data?.taskId;
  const targetUrl = taskId ? `/emergency-recovery?taskId=${taskId}` : "/dashboard";
  event.waitUntil(self.clients.openWindow(targetUrl));
});
