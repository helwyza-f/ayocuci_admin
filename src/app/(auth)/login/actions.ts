"use server";

import { cookies } from "next/headers";

/**
 * Sets the admin session cookie on the server side.
 * This is called after a successful login API response.
 */
export async function setAdminSession(token: string) {
  const cookieStore = await cookies();

  cookieStore.set("admin_token", token, {
    httpOnly: true, // Prevents XSS attacks from reading the token
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
}

/**
 * Deletes the session cookie to log the user out.
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
}
