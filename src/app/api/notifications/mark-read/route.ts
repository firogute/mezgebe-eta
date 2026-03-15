import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      audience?: "ADMIN" | "USER";
      username?: string;
      id?: string;
      all?: boolean;
    };

    if (body.audience !== "ADMIN" && body.audience !== "USER") {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
    }

    if (body.audience === "ADMIN") {
      const adminToken = request.cookies.get("admin_token")?.value;
      if (adminToken !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (body.all) {
        await prisma.$executeRawUnsafe(
          'UPDATE "Notification" SET "isRead" = true, "readAt" = NOW() WHERE "audience" = $1::"NotificationAudience" AND "isRead" = false',
          "ADMIN",
        );
      } else if (body.id) {
        await prisma.$executeRawUnsafe(
          'UPDATE "Notification" SET "isRead" = true, "readAt" = NOW() WHERE "id" = $1 AND "audience" = $2::"NotificationAudience"',
          body.id,
          "ADMIN",
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!body.username) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { username: body.username.trim().toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (body.all) {
      await prisma.$executeRawUnsafe(
        'UPDATE "Notification" SET "isRead" = true, "readAt" = NOW() WHERE "audience" = $1::"NotificationAudience" AND "userId" = $2 AND "isRead" = false',
        "USER",
        user.id,
      );
    } else if (body.id) {
      await prisma.$executeRawUnsafe(
        'UPDATE "Notification" SET "isRead" = true, "readAt" = NOW() WHERE "id" = $1 AND "audience" = $2::"NotificationAudience" AND "userId" = $3',
        body.id,
        "USER",
        user.id,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification mark-read failed", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
