"use server";

import prisma from "../prisma";
import { getEthiopianPhoneError, normalizeEthiopianPhone } from "../phone";

export async function checkUsername(username: string) {
  try {
    const normalizedUsername = username.trim().toLowerCase();

    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; phone: string | null }>
    >(
      'SELECT "id", "phone" FROM "User" WHERE "username" = $1 LIMIT 1',
      normalizedUsername,
    );

    const user = rows[0] || null;
    const normalizedExistingPhone = user?.phone
      ? normalizeEthiopianPhone(user.phone)
      : null;

    return {
      available: !user,
      hasPhone: Boolean(normalizedExistingPhone),
      phone: normalizedExistingPhone,
    };
  } catch (error) {
    console.error("Error checking username:", error);
    return {
      available: false,
      hasPhone: false,
      phone: null,
      error: "Failed to check username",
    };
  }
}

export async function registerUsername(username: string, phone: string) {
  try {
    const normalizedUsername = username.trim().toLowerCase();
    const phoneError = getEthiopianPhoneError(phone);

    if (phoneError) {
      return { success: false, error: phoneError };
    }

    const normalizedPhone = normalizeEthiopianPhone(phone);

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

    const createdUser = await prisma.user.create({
      data: {
        username: normalizedUsername,
        role: "USER",
      },
    });

    await prisma.$executeRawUnsafe(
      'UPDATE "User" SET "phone" = $1 WHERE "id" = $2',
      normalizedPhone,
      createdUser.id,
    );

    return { success: true };
  } catch (error) {
    console.error("Error registering username:", error);
    return { success: false, error: "Failed to register username" };
  }
}

export async function updateUserPhone(username: string, phone: string) {
  try {
    const normalizedUsername = username.trim().toLowerCase();
    const phoneError = getEthiopianPhoneError(phone);

    if (phoneError) {
      return { success: false, error: phoneError };
    }

    const normalizedPhone = normalizeEthiopianPhone(phone);

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Username does not exist." };
    }

    await prisma.$executeRawUnsafe(
      'UPDATE "User" SET "phone" = $1 WHERE "id" = $2',
      normalizedPhone,
      user.id,
    );

    return { success: true, phone: normalizedPhone };
  } catch (error) {
    console.error("Error updating phone:", error);
    return { success: false, error: "Failed to update phone number" };
  }
}
