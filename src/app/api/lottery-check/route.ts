import { NextRequest, NextResponse } from "next/server";
import { checkAndRunLotteries } from "@/lib/actions/lottery";

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or manually
    const result = await checkAndRunLotteries();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      message: "Lotteries checked and run successfully",
      results: result.results,
    });
  } catch (error) {
    console.error("Lottery check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
