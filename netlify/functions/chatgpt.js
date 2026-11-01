const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST." });

  const bearer = header(event, "authorization");
  if (!/^Bearer [A-Za-z0-9._~-]{1,8192}$/i.test(bearer)) {
    return json(401, { error: "Sign in to use the live assistant." });
  }

  let payload;
  try {
    payload = parsePayload(event);
  } catch (error) {
    return json(error.status || 400, { error: error.publicMessage || "Invalid assistant request." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = configuredSupabaseUrl(process.env.SUPABASE_URL);
  if (!apiKey || !anonKey || !supabaseUrl) {
    return json(503, { error: "The live assistant is temporarily unavailable." });
  }

  // A shared admission deadline leaves room for the 20-second provider call
  // inside the browser's existing 30-second timeout.
  const admission = new AbortController();
  const admissionTimer = setTimeout(() => admission.abort(), 8000);
  const authHeaders = { apikey: anonKey, Authorization: bearer, Accept: "application/json" };
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: authHeaders, signal: admission.signal,
    });
    if (userResponse.status === 401 || userResponse.status === 403) {
      return json(401, { error: "Your sign-in expired. Sign in again to use the live assistant." });
    }
    if (!userResponse.ok) throw new Error("Auth unavailable");
    const user = await userResponse.json();
    if (!user || typeof user.id !== "string" || !/^[0-9a-f-]{36}$/i.test(user.id)) {
      throw new Error("Invalid Auth response");
    }

    const rosterResponse = await fetch(
      `${supabaseUrl}/rest/v1/team_members?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers: authHeaders, signal: admission.signal },
    );
    if (!rosterResponse.ok) throw new Error("Roster unavailable");
    const roster = await rosterResponse.json();
    if (!Array.isArray(roster)) throw new Error("Invalid roster response");
    if (!roster.some((member) => member && member.user_id === user.id)) {
      return json(403, { error: "This sign-in is not on the Rain or Shine team roster." });
    }

    const quotaResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_assistant_quota`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: "{}", signal: admission.signal,
    });
    if (!quotaResponse.ok) throw new Error("Quota unavailable");
    const quotas = await quotaResponse.json();
    const quota = Array.isArray(quotas) && quotas.length === 1 ? quotas[0] : null;
    if (!quota || typeof quota.allowed !== "boolean" ||
        !Number.isInteger(quota.retry_after) || quota.retry_after < 0 || quota.retry_after > 86400) {
      throw new Error("Invalid quota response");
    }
    if (!quota.allowed) {
      const retryAfter = Math.max(1, quota.retry_after);
      return json(429, { error: "Assistant limit reached. Please try again later.", retry_after: retryAfter },
        { "Retry-After": String(retryAfter) });
    }
    if (admission.signal.aborted) throw new Error("Admission timed out");
  } catch {
    return json(503, { error: "Team access could not be checked. Please try again later." });
  } finally {
    clearTimeout(admissionTimer);
  }

  const content = [{
    type: "input_text",
    text: [
      "You are the Rain or Shine Birding Team assistant.",
      "Help with bird identification, field marks, eBird notes, trip planning, and friendly general birding chat.",
      "For image IDs, give likely candidates, confidence, key field marks, and what details would improve the ID.",
      "Be concise, practical, and careful about uncertainty.",
      `User message: ${payload.message || "Please help identify this bird."}`,
    ].join("\n"),
  }];
  if (payload.image) content.push({ type: "input_image", image_url: payload.image });

  const upstream = new AbortController();
  const upstreamTimer = setTimeout(() => upstream.abort(), 20000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: upstream.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
        input: [{ role: "user", content }],
        max_output_tokens: 800,
      }),
    });
    // Reserve 401 for identity rejection, before any paid provider call.
    if (!response.ok) return json(502, { error: "The live assistant could not answer. Please try again later." });
    const data = await response.json();
    if (upstream.signal.aborted) return json(504, { error: "The live assistant timed out. Please try again later." });
    const reply = typeof data?.output_text === "string" && data.output_text ? data.output_text : collectOutputText(data);
    return json(200, { reply: reply || "I could not find a text response." });
  } catch {
    return upstream.signal.aborted
      ? json(504, { error: "The live assistant timed out. Please try again later." })
      : json(502, { error: "The live assistant could not answer. Please try again later." });
  } finally {
    clearTimeout(upstreamTimer);
  }
};

function header(event, name) {
  const entry = Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === name);
  return entry && typeof entry[1] === "string" ? entry[1] : "";
}

function configuredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || "").trim().replace(/\/(?:rest|auth)\/v1\/?$/i, ""));
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.search && !url.hash && ["", "/"].includes(url.pathname) ? url.origin : "";
  } catch { return ""; }
}

function invalid(status, publicMessage) {
  const error = new Error("Invalid request");
  error.status = status;
  error.publicMessage = publicMessage;
  throw error;
}

function parsePayload(event) {
  if (typeof event.body !== "string") invalid(400, "Send a JSON assistant request.");
  let body = event.body;
  if (event.isBase64Encoded) {
    if (body.length > Math.ceil(MAX_BODY_BYTES / 3) * 4) invalid(413, "Assistant requests must be 3 MiB or smaller.");
    if (!validBase64(body)) invalid(400, "Send a valid JSON assistant request.");
    body = Buffer.from(body, "base64").toString("utf8");
  }
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) invalid(413, "Assistant requests must be 3 MiB or smaller.");
  let payload;
  try { payload = JSON.parse(body); } catch { invalid(400, "Send a valid JSON assistant request."); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) invalid(400, "Send a JSON assistant request object.");
  const message = payload.message === undefined ? "" : payload.message;
  if (typeof message !== "string" || message.length > 4000) invalid(400, "Messages must be text with at most 4,000 characters.");
  const image = payload.image == null ? null : validateImage(payload.image);
  if (!message.trim() && !image) invalid(400, "Add a message or a bird photo.");
  return { message, image };
}

function validBase64(value) {
  return value.length > 0 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value) &&
    Buffer.from(value, "base64").toString("base64") === value;
}

function validateImage(image) {
  if (typeof image !== "object" || Array.isArray(image) || typeof image.dataUrl !== "string") {
    invalid(400, "Attach a JPEG, PNG, or WebP bird photo.");
  }
  if (image.dataUrl.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64) invalid(413, "Bird photos must be 2 MiB or smaller.");
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.dataUrl);
  if (!match || !validBase64(match[2]) || (image.type && image.type !== match[1])) {
    invalid(400, "Attach a valid JPEG, PNG, or WebP bird photo.");
  }
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES) invalid(413, "Bird photos must be 2 MiB or smaller.");
  const validJpeg = match[1] === "image/jpeg" && jpegContainer(bytes);
  const validPng = match[1] === "image/png" && pngContainer(bytes);
  const validWebp = match[1] === "image/webp" && webpContainer(bytes);
  if (!validJpeg && !validPng && !validWebp) invalid(400, "The photo format does not match its image data.");
  return image.dataUrl;
}

// Validate bounded image containers without decompressing attacker-controlled
// pixels. The vision provider performs the final codec decode.
function jpegContainer(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) return false;
  let offset = 2;
  let frame = false;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset++] !== 0xff) return false;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (offset + 2 > bytes.length) return false;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length - 2) return false;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      if (length < 8 || !bytes.readUInt16BE(offset + 3) || !bytes.readUInt16BE(offset + 5)) return false;
      frame = true;
    }
    if (marker === 0xda) return frame && length >= 6 && offset + length < bytes.length - 2;
    offset += length;
  }
  return false;
}

function pngContainer(bytes) {
  if (bytes.length < 57 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return false;
  let offset = 8;
  let pixels = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    if (offset + 12 + length > bytes.length) return false;
    if (offset === 8 && (type !== "IHDR" || length !== 13 ||
        !bytes.readUInt32BE(offset + 8) || !bytes.readUInt32BE(offset + 12))) return false;
    if (type === "IDAT" && length) pixels = true;
    offset += 12 + length;
    if (type === "IEND") return length === 0 && pixels && offset === bytes.length;
  }
  return false;
}

function webpContainer(bytes) {
  if (bytes.length < 26 || bytes.toString("latin1", 0, 4) !== "RIFF" ||
      bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.toString("latin1", 8, 12) !== "WEBP") return false;
  let offset = 12;
  let pixels = false;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString("latin1", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + length > bytes.length) return false;
    if (type === "VP8 " && length >= 10 && bytes.toString("hex", offset + 11, offset + 14) === "9d012a") pixels = true;
    if (type === "VP8L" && length >= 5 && bytes[offset + 8] === 0x2f) pixels = true;
    if (type === "ANMF" && length >= 24) pixels = true;
    offset += 8 + length + (length % 2);
  }
  return pixels && offset === bytes.length;
}

function collectOutputText(data) {
  return (Array.isArray(data?.output) ? data.output : [])
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text).join("\n").trim();
}

function json(statusCode, body, headers = {}) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }, body: JSON.stringify(body) };
}
