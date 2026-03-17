"use server";

import prisma from "../prisma";

export async function runLottery(eventId: string) {
  try {
    // Get the event with all sold tickets
    const event = await prisma.etaEvent.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          where: { status: "SOLD" },
          include: {
            reservation: {
              include: {
                user: true,
                payment: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status === "LOTTERY_COMPLETED") {
      return {
        success: false,
        error: "Lottery already completed for this event",
      };
    }

    const soldTickets = event.tickets.filter(
      (ticket) => ticket.status === "SOLD",
    );

    if (soldTickets.length === 0) {
      return { success: false, error: "No sold tickets to run lottery with" };
    }

    // Randomly select winners
    const winnerCount = event.winnerCount;
    const shuffledTickets = [...soldTickets].sort(() => Math.random() - 0.5);
    const winningTickets = shuffledTickets.slice(
      0,
      Math.min(winnerCount, soldTickets.length),
    );

    // Update winning tickets
    await prisma.$transaction(async (tx) => {
      // Mark winning tickets
      for (const ticket of winningTickets) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: "WINNER" },
        });
      }

      // Update event status
      await tx.etaEvent.update({
        where: { id: eventId },
        data: {
          status: "LOTTERY_COMPLETED",
          lotteryRunAt: new Date(),
        },
      });
    });

    // Get winner information for notifications
    const winners = winningTickets.map((ticket) => ({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.reservation?.userId,
      username: ticket.reservation?.user?.username,
      phone: ticket.reservation?.user?.phone,
    }));

    return {
      success: true,
      winners,
      winnerCount: winningTickets.length,
      totalTickets: soldTickets.length,
    };
  } catch (error) {
    console.error("Lottery error:", error);
    return { success: false, error: "Failed to run lottery" };
  }
}

export async function checkAndRunLotteries() {
  try {
    // Find events that need lottery
    const eventsToProcess = await prisma.etaEvent.findMany({
      where: {
        OR: [{ deadline: { lte: new Date() } }, { status: "ENDED" }],
        status: { in: ["ACTIVE", "ENDED"] },
      },
    });

    const results = [];

    for (const event of eventsToProcess) {
      const result = await runLottery(event.id);
      results.push({
        eventId: event.id,
        eventTitle: event.title,
        ...result,
      });
    }

    return { success: true, results };
  } catch (error) {
    console.error("Check lotteries error:", error);
    return { success: false, error: "Failed to check and run lotteries" };
  }
}

export async function endEvent(eventId: string) {
  try {
    await prisma.etaEvent.update({
      where: { id: eventId },
      data: { status: "ENDED" },
    });

    // Try to run lottery immediately
    const result = await runLottery(eventId);

    return result;
  } catch (error) {
    console.error("End event error:", error);
    return { success: false, error: "Failed to end event" };
  }
}
