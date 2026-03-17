import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/actions/reservation";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin via the same cookie used by admin middleware.
    const adminToken = request.cookies.get("admin_token")?.value;
    if (adminToken !== "authenticated") {
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
