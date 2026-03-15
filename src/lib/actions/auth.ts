"use server";

import prisma from "../prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function authenticateAdmin(username: string, passwordStr: string) {
  try {
    const admin = await prisma.user.findUnique({
      where: { username }
    });

    if (!admin || admin.role !== "ADMIN" || !admin.password) {
      return { success: false, error: "Invalid credentials" };
    }

    const isValid = await bcrypt.compare(passwordStr, admin.password);
    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("Auth error:", err);
    return { success: false, error: "Authentication failed" };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
}
