import prisma from "./prisma";

function createNotificationId() {
  return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createAdminNotification(input: {
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "Notification" ("id", "audience", "title", "message", "link", "isRead", "createdAt") VALUES ($1, $2::"NotificationAudience", $3, $4, $5, false, NOW())',
      createNotificationId(),
      "ADMIN",
      input.title,
      input.message,
      input.link || null,
    );
  } catch (error) {
    console.error("Failed to create admin notification", error);
  }
}

export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "Notification" ("id", "audience", "userId", "title", "message", "link", "isRead", "createdAt") VALUES ($1, $2::"NotificationAudience", $3, $4, $5, $6, false, NOW())',
      createNotificationId(),
      "USER",
      input.userId,
      input.title,
      input.message,
      input.link || null,
    );
  } catch (error) {
    console.error("Failed to create user notification", error);
  }
}
