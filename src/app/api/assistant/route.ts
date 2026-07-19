import Groq from "groq-sdk";

/**
 * The Prinsta assistant's backend.
 *
 * This route exists so the model call happens server-side. `GROQ_API_KEY` is a
 * secret: called from the browser it would ship in the client bundle and be
 * readable by anyone, and the key is account-wide, not per-user. The browser
 * talks to this route; only this route talks to Groq.
 *
 * The response is streamed. A support answer takes a few seconds to generate in
 * full, and the widget renders tokens as they arrive rather than showing a
 * spinner for the whole wait.
 */

// The Node runtime, not Edge: the SDK is a Node client, and this route is not
// latency-critical enough to be worth the Edge constraints.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "openai/gpt-oss-120b";

/**
 * What the assistant is allowed to claim.
 *
 * Everything factual the model can state about Prinsta is here. The rest of the
 * prompt is about what it must NOT do: the failure that matters for a support
 * bot is not a clumsy answer, it is a confident wrong one — an invented price or
 * an invented retention window is a promise the product then has to keep.
 */
const SYSTEM_PROMPT = `You are the Prinsta assistant, the support agent on Prinsta's website.

Prinsta turns campus shops and print centres into self-service printing kiosks. A student scans the QR code on a printer, uploads a document from their phone, picks pages and colour, pays, and collects the prints.

FACTS YOU MAY STATE:
- How it works: scan the printer's QR code -> upload the file -> preview and select pages -> pay -> collect. Usually under a minute end to end.
- Supported files: PDFs, Word documents and images. A page-by-page preview is shown before payment, so users can deselect pages they don't need.
- Privacy: uploads are encrypted in transit, and files are deleted from Prinsta's servers within 2 minutes of printing. Prinsta never stores, shares or sells user documents.
- Payment: UPI, card, or Prinsta Points. Payments are processed by Razorpay, so card details never reach Prinsta's own servers.
- Points: a prepaid balance. Topping up and paying with Points makes every print 10% cheaper than paying by UPI.
- Pricing: charged per page. Black & white and colour are priced separately, and each printer's owner sets their own rate, so the exact rate varies by location. The full total is always shown in the app before payment.
- Failed prints: the amount is returned to the user's Points balance.
- App: available for Android now; iOS is coming.
- For shop owners: anyone can register a printer and run it as a self-service kiosk, set their own rates, and track orders and revenue from the vendor console. No commission during the beta.
- Support contact: codeml862@gmail.com or +91 70932 21536.

RULES:
- Only answer questions about Prinsta. If asked about anything else, say that's outside what you can help with and offer to answer a Prinsta question instead.
- Never invent a specific price, percentage, timeframe, feature or policy. If a number is not in the facts above, say it varies or that you don't have it, and point to support.
- If you are not confident, say so plainly and give the support email and phone number. An honest "I don't know, here's who does" is a good answer; a plausible-sounding guess is not.
- Never ask for passwords, OTPs, card numbers or UPI PINs, and tell the user Prinsta staff will never ask either.
- Keep answers to 2-3 sentences unless asked for detail. This renders in a small chat panel.
- Be warm and plain-spoken. No markdown formatting, no bullet lists, no headings — plain sentences only.`;

/** Caps. The history is client-supplied, so none of it is trusted. */
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 20;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Per-IP rate limit.
 *
 * In-process, so it resets on deploy and is per-instance rather than global —
 * deliberately the cheap version. It exists to stop one browser tab looping the
 * endpoint, not to defend against a distributed attack. Move to a shared store
 * (Redis, Upstash) if this ever needs to hold across instances.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 20 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    // Opportunistic sweep — without it the map grows once per unique IP, for
    // the life of the process.
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
    }
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

/** Keep only what we can vouch for: two known roles, non-empty, length-capped. */
function sanitize(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // A missing key is a deployment mistake, not a user error — say so in the
    // logs, but don't leak configuration details to the browser.
    console.error("[assistant] GROQ_API_KEY is not set");
    return Response.json({ error: "The assistant is not configured." }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = sanitize(body?.messages);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (messages.length === 0) {
    return Response.json({ error: "No message to answer." }, { status: 400 });
  }

  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      // Low, not the default 1: this is factual support, and sampling variety
      // here reads as inconsistency — the same question should get the same
      // answer twice.
      temperature: 0.3,
      max_completion_tokens: 700,
      reasoning_effort: "low",
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          // The response has already begun, so the status code is spent —
          // close the stream and let the client keep the partial answer.
          console.error("[assistant] stream failed", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        // Proxies that buffer would defeat the point of streaming.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[assistant] request failed", err);
    return Response.json(
      { error: "The assistant is unavailable right now. Please try again." },
      { status: 502 }
    );
  }
}
