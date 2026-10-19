"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, homeFor } from "@/lib/auth";

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let user;
  try {
    user = await db.user.findUnique({ where: { email } });
    if (!user || !(await compare(password, user.password))) {
      return { error: "Invalid email or password." };
    }
  } catch {
    return {
      error:
        "Could not reach the server — wait a few seconds (first load can be slow) and try again.",
    };
  }

  try {
    await createSession(user);
  } catch {
    return { error: "Could not start your session — please try again." };
  }
  redirect(homeFor(user.role as never));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
