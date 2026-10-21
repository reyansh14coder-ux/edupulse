const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"] as const;

export type GeminiCallOptions = {
  prompt: string;
  system?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
};

type AttemptResult = { status: number; body: string };

const cache = new Map<string, { value: unknown; exp: number }>();

function apiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

async function post(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number
): Promise<AttemptResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ac.signal,
      cache: "no-store",
    });
    const text = await res.text();
    return { status: res.status, body: text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 0, body: msg };
  } finally {
    clearTimeout(timer);
  }
}

function isAttemptError(r: AttemptResult): r is { status: number; body: string } {
  return "status" in r;
}

function deepCollectText(node: unknown, out: string[], depth = 0): void {
  if (depth > 8 || node == null) return;
  if (typeof node === "string") return;
  if (Array.isArray(node)) {
    for (const item of node) deepCollectText(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (obj.thought === true) return;
  for (const key of ["text", "output_text", "outputText"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) {
      out.push(v);
      return;
    }
  }
  for (const value of Object.values(obj)) deepCollectText(value, out, depth + 1);
}

function extractGenerateContentText(data: unknown): string | null {
  const d = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      text?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };
  const cand = d?.candidates?.[0];
  if (cand?.content?.parts?.length) {
    const t = cand.content.parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
    if (t.trim()) return t;
  }
  if (cand?.text?.trim()) return cand.text;
  return null;
}

function extractInteractionsText(data: unknown): string | null {
  const d = data as { output_text?: unknown; outputText?: unknown };
  for (const v of [d?.output_text, d?.outputText]) {
    if (typeof v === "string" && v.trim()) return v;
  }
  const parts: string[] = [];
  deepCollectText(data, parts);
  const t = parts.join("").trim();
  return t || null;
}

async function withRetries(
  fn: () => Promise<AttemptResult>,
  retries: number
): Promise<AttemptResult> {
  let result = await fn();
  for (let i = 0; i < retries; i++) {
    if (isAttemptError(result) && (result.status === 0 || result.status >= 500 || result.status === 429)) {
      await new Promise((r) => setTimeout(r, 700));
      result = await fn();
    } else break;
  }
  return result;
}

async function viaGenerateContent(
  model: string,
  opts: GeminiCallOptions,
  key: string
): Promise<AttemptResult> {
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.6,
    maxOutputTokens: opts.maxTokens ?? 1200,
  };
  if (opts.json) generationConfig.responseMimeType = "application/json";
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig,
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }
  const timeout = opts.timeoutMs ?? 6000;
  return post(`${BASE}/models/${model}:generateContent?key=${key}`, {}, body, timeout);
}

async function viaInteractions(
  model: string,
  opts: GeminiCallOptions,
  key: string
): Promise<AttemptResult> {
  const generation_config: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.6,
    max_output_tokens: opts.maxTokens ?? 1200,
  };
  if (opts.json) generation_config.response_mime_type = "application/json";
  const body: Record<string, unknown> = {
    model,
    input: opts.prompt,
    generation_config,
    store: false,
  };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };
  const timeout = opts.timeoutMs ?? 6000;
  return post(`${BASE}/interactions`, { "x-goog-api-key": key }, body, timeout);
}

function parsed(data: unknown): string | null {
  if (typeof data !== "object" || data == null) return null;
  const gen = extractGenerateContentText(data);
  const inter = extractInteractionsText(data);
  const text = (gen && gen.length >= (inter?.length ?? 0) ? gen : inter) ?? null;
  if (!text) return null;
  return text;
}

/** Returns raw model text, or null on any failure (missing key, denial, timeout, bad shape). */
export async function callGeminiText(opts: GeminiCallOptions): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;

  if (opts.cacheKey) {
    const hit = cache.get(opts.cacheKey);
    if (hit && hit.exp > Date.now() && typeof hit.value === "string") return hit.value;
  }

  const retries = opts.retries ?? 0;
  const attempts: Array<() => Promise<AttemptResult>> = [];
  for (const m of MODELS) attempts.push(() => viaGenerateContent(m, opts, key));
  for (const m of MODELS) attempts.push(() => viaInteractions(m, opts, key));

  for (const run of attempts) {
    const result = await withRetries(run, retries);
    if (result.status !== 200) {
      if (result.status === 403 || result.status === 401 || result.status === 400) {
        console.warn(`[gemini] blocked (${result.status})`);
        return null;
      }
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(result.body);
    } catch {
      continue;
    }
    const text = parsed(data);
    if (text) {
      if (opts.cacheKey) {
        cache.set(opts.cacheKey, {
          value: text,
          exp: Date.now() + (opts.cacheTtlMs ?? 15 * 60_000),
        });
      }
      return text;
    }
  }
  console.warn("[gemini] no usable response");
  return null;
}

function stripFences(t: string): string {
  let s = t.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return s;
}

export async function callGeminiJSON<T>(
  opts: GeminiCallOptions,
  validate?: (v: unknown) => T | null
): Promise<T | null> {
  if (opts.cacheKey) {
    const hit = cache.get(opts.cacheKey);
    if (hit && hit.exp > Date.now()) return hit.value as T;
  }
  const text = await callGeminiText({ ...opts, json: true, cacheKey: undefined });
  if (!text) return null;
  let data: unknown;
  try {
    data = JSON.parse(stripFences(text));
  } catch {
    console.warn("[gemini] invalid JSON in response");
    return null;
  }
  const value = validate ? validate(data) : (data as T);
  if (value == null) return null;
  if (opts.cacheKey) {
    cache.set(opts.cacheKey, { value, exp: Date.now() + (opts.cacheTtlMs ?? 15 * 60_000) });
  }
  return value;
}
