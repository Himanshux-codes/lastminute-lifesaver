"use client";

import { useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { requestPushToken } from "@/lib/messaging";
import { apiFetch } from "@/lib/apiClient";

export function PushNotificationToggle() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "denied" | "unsupported">("idle");

  async function enable() {
    setStatus("loading");
    try {
      const token = await requestPushToken();
      if (!token) {
        setStatus("unsupported");
        return;
      }
      await apiFetch("/api/notifications/register-token", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus("enabled");
    } catch {
      setStatus("denied");
    }
  }

  if (status === "enabled") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-risk-low/30 px-3 py-1.5 text-xs text-risk-low">
        <BellRing size={12} /> Alerts on
      </span>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={status === "loading"}
      title={
        status === "unsupported"
          ? "Push notifications aren't supported in this browser"
          : status === "denied"
          ? "Notification permission was denied"
          : "Get a push the moment a task turns critical"
      }
      className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-muted transition hover:text-ink disabled:opacity-50"
    >
      {status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
      {status === "denied" ? "Enable in browser settings" : status === "unsupported" ? "Not supported here" : "Enable alerts"}
    </button>
  );
}
