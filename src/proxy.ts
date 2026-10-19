import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_SECRET_FALLBACK,
} from "@/lib/session-constants";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK
);

function homeFor(role: string) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    case "STUDENT":
      return "/student";
    default:
      return "/login";
  }
}

const ROLE_SEGMENTS: Record<string, string> = {
  admin: "ADMIN",
  teacher: "TEACHER",
  student: "STUDENT",
  parent: "PARENT",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = String(payload.role);
    } catch {
      role = null;
    }
  }

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/counseling");

  if (isProtected && !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && role) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (pathname === "/" && role) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (isProtected && role) {
    const segment = pathname.split("/")[1];
    const required = ROLE_SEGMENTS[segment];
    if (required && required !== role) {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
    if (segment === "counseling" && role === "STUDENT") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (segment === "counseling" && role === "PARENT") {
      return NextResponse.redirect(new URL("/parent", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
