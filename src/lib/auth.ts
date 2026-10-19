import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "Vidyora_session";

export type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

export type Session = {
  sub: string;
  name: string;
  email: string;
  role: Role;
  title?: string | null;
};

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "Vidyora-dev-secret-change-in-production"
);

export function homeFor(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    case "STUDENT":
      return "/student";
  }
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
      title: (payload.title as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string | null;
}) {
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}
