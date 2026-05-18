import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — web-push from npm via esm.sh
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(
  "mailto:hello@jellyrate.app",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  jellyrate_id: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Database webhook sends: { type: "INSERT", record: {...} }
    const record = payload.record as MessageRecord;
    if (!record) return new Response("no record", { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the recipient (other participant)
    const { data: recipientId } = await supabase.rpc("get_conversation_recipient", {
      conv_id: record.conversation_id,
      sender: record.sender_id,
    });
    if (!recipientId) return new Response("no recipient", { status: 200 });

    // Get sender's display name
    const { data: sender } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", record.sender_id)
      .single();
    const senderName = sender?.full_name || sender?.username || "Alguien";

    // Build notification body
    let body: string;
    if (record.jellyrate_id) {
      body = "Te compartió un JellyRate";
    } else {
      body = record.text ?? "Nuevo mensaje";
      if (body.length > 80) body = body.slice(0, 77) + "...";
    }

    // Get push subscriptions for recipient
    const { data: subs } = await supabase.rpc("get_push_subscriptions_for_user", {
      target_user_id: recipientId,
    });
    if (!subs || subs.length === 0) return new Response("no subs", { status: 200 });

    const notifPayload = JSON.stringify({
      title: senderName,
      body,
      url: `/messages/${record.conversation_id}`,
    });

    // Send to all devices
    const sends = subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload
        );
      } catch (err: any) {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    });

    await Promise.allSettled(sends);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
});
