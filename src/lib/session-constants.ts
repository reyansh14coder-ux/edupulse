export const SESSION_COOKIE = "Vidyora_session";

// Single source of truth for BOTH the Node runtime (login/session) and the
// Edge proxy. Never read process.env here: Next inlines process.env at build
// time for middleware but resolves it at runtime for server actions, so an
// env-based secret can silently diverge and reject every fresh session.
export const SESSION_SECRET =
  "vidyora-super-secret-key-change-in-production-9f2b7c1d";
