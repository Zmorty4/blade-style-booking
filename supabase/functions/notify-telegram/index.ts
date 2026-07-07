// Supabase Edge Function: notify-telegram
// Deploy: supabase functions deploy notify-telegram --no-verify-jwt
// Secrets required: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { client_name, phone, service_name, master_name, booking_date, booking_time, comment } = await req.json();

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, skipped: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const text = [
      "✂️ *НОВАЯ ЗАПИСЬ*",
      "━━━━━━━━━━━━━━━",
      `👤 Клиент: ${client_name}`,
      `📞 Телефон: ${phone}`,
      `🪒 Услуга: ${service_name}`,
      `👨 Мастер: ${master_name}`,
      `📅 Дата: ${booking_date}`,
      `🕐 Время: ${booking_time}`,
      `💬 Комментарий: ${comment || "нет"}`,
      "━━━━━━━━━━━━━━━",
    ].join("\n");

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
