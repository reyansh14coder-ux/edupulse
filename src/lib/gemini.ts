const BASE = "https://api.groq.com/openai/v1";
const MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"] as const;

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
  const key = process.env.GROQ_API_KEY?.trim();
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

async function withRetries(
  fn: () => Promise<AttemptResult>,
  retries: number
): Promise<AttemptResult> {
  let result = await fn();
  for (let i = 0; i < retries; i++) {
    if (
      isAttemptError(result) &&
      (result.status === 0 || result.status >= 500 || result.status === 429)
    ) {
      await new Promise((r) => setTimeout(r, 700));
      result = await fn();
    } else break;
  }
  return result;
}

function isAttemptError(r: AttemptResult): r is { status: number; body: string } {
  return "status" in r;
}

async function viaChat(
  model: string,
  opts: GeminiCallOptions,
  key: string
): Promise<AttemptResult> {
  const isReasoning = model.includes("gpt-oss");
  const baseTokens = opts.maxTokens ?? 1200;
  const body: Record<string, unknown> = {
    model,
    messages: [
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: opts.prompt },
    ],
    temperature: opts.temperature ?? 0.6,
    max_tokens: isReasoning ? baseTokens + 512 : baseTokens,
  };
  if (opts.json) body.response_format = { type: "json_object" };
  if (isReasoning) body.reasoning_effort = "low";
  const timeout = opts.timeoutMs ?? 6000;
  return post(`${BASE}/chat/completions`, { Authorization: `Bearer ${key}` }, body, timeout);
}

function extractChatText(data: unknown): string | null {
  const d = data as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const c = d?.choices?.[0]?.message?.content;
  if (typeof c === "string" && c.trim()) return c;
  return null;
}

function parsed(data: unknown): string | null {
  if (typeof data !== "object" || data == null) return null;
  return extractChatText(data);
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

  for (const m of MODELS) {
    const result = await withRetries(() => viaChat(m, opts, key), retries);
    if (result.status === 401 || result.status === 403) {
      console.warn(`[llm] blocked (${result.status})`);
      return null;
    }
    if (result.status !== 200) {
      console.warn(`[llm] model ${m} failed (${result.status})`);
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
  console.warn("[llm] no usable response");
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
    console.warn("[llm] invalid JSON in response");
    return null;
  }
  const value = validate ? validate(data) : (data as T);
  if (value == null) return null;
  if (opts.cacheKey) {
    cache.set(opts.cacheKey, { value, exp: Date.now() + (opts.cacheTtlMs ?? 15 * 60_000) });
  }
  return value;
}
