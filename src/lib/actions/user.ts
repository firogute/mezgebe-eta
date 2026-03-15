"use server";

import prisma from "../prisma";

export async function checkUsername(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return { available: !user };
  } catch (error) {
    console.error("Error checking username:", error);
    return { available: false, error: "Failed to check username" };
  }
}

export async function registerUsername(username: string) {
  try {
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      return { success: false, error: "Username is already taken." };
    }

    await prisma.user.create({
      data: {
        username: normalizedUsername,
        role: "USER",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering username:", error);
    return { success: false, error: "Failed to register username" };
  }
}
