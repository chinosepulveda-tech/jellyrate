"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY =
  "BCHooAO1A8Exfu6X4xROg42_kjAo3u-Lm3AIHlzSHBkNpKvTdWOi7C3Yey1mZcXMjmcKp0zAQYAzRD_n-5th_64";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const supabase = createClient();

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;

    async function register() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Register (or get existing) service worker
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Check current permission — don't ask if already denied
        if (Notification.permission === "denied") return;

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Subscribe to push
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const { endpoint, keys } = sub.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };

        // Upsert subscription in DB
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
          { onConflict: "user_id,endpoint" }
        );
      } catch (err) {
        // Push not supported or user dismissed — fail silently
        console.warn("Push registration skipped:", err);
      }
    }

    register();
  }, [supabase]);
}
