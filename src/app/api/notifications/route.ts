import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export async function GET(request: NextRequest) {
  try {
    const audience = request.nextUrl.searchParams.get("audience");
    const username = request.nextUrl.searchParams.get("username");

    if (audience !== "ADMIN" && audience !== "USER") {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
    }

    if (audience === "ADMIN") {
      const adminToken = request.cookies.get("admin_token")?.value;
      if (adminToken !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let userId: string | null = null;
    if (audience === "USER") {
      if (!username) {
        return NextResponse.json({ unreadCount: 0, notifications: [] });
      }

      const user = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
        select: { id: true },
      });

      userId = user?.id || null;
      if (!userId) {
        return NextResponse.json({ unreadCount: 0, notifications: [] });
      }
    }

    const [unreadRows, notifications] =
      audience === "ADMIN"
        ? await Promise.all([
            prisma.$queryRawUnsafe<{ count: number }[]>(
              'SELECT COUNT(*)::int AS count FROM "Notification" WHERE "audience" = $1::"NotificationAudience" AND "isRead" = false',
              "ADMIN",
            ),
            prisma.$queryRawUnsafe<NotificationRow[]>(
              'SELECT "id", "title", "message", "link", "isRead", "createdAt" FROM "Notification" WHERE "audience" = $1::"NotificationAudience" ORDER BY "createdAt" DESC LIMIT 25',
              "ADMIN",
            ),
          ])
        : await Promise.all([
            prisma.$queryRawUnsafe<{ count: number }[]>(
              'SELECT COUNT(*)::int AS count FROM "Notification" WHERE "audience" = $1::"NotificationAudience" AND "userId" = $2 AND "isRead" = false',
              "USER",
              userId,
            ),
            prisma.$queryRawUnsafe<NotificationRow[]>(
              'SELECT "id", "title", "message", "link", "isRead", "createdAt" FROM "Notification" WHERE "audience" = $1::"NotificationAudience" AND "userId" = $2 ORDER BY "createdAt" DESC LIMIT 25',
              "USER",
              userId,
            ),
          ]);

    const unreadCount = unreadRows[0]?.count || 0;

    return NextResponse.json({ unreadCount, notifications });
  } catch (error) {
    console.error("Notification fetch failed", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
