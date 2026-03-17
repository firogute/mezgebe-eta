import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/actions/reservation";
import { auth } from "@/lib/actions/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await auth();
    if (!authResult.success || authResult.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    // Run cleanup
    const result = await releaseExpiredReservations();

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Cleanup API error:", error);
    return NextResponse.json(
      { error: "Failed to run cleanup" },
      { status: 500 },
    );
  }
}
