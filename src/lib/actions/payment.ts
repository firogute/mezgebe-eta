"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";

export async function verifyPayment(
  paymentId: string,
  action: "APPROVE" | "REJECT",
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        reservation: {
          include: { tickets: true },
        },
      },
    });

    if (!payment) return { success: false, error: "Payment not found" };

    if (action === "APPROVE") {
      // 1. Mark Payment as VERIFIED
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "VERIFIED" },
      });
      // 2. Mark Reservation as APPROVED
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { status: "APPROVED" },
      });
      // 3. Mark Tickets as SOLD
      const ticketIds = payment.reservation.tickets.map((t) => t.id);
      await prisma.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: { status: "SOLD" },
      });
    } else {
      // REJECT action
      // 1. Mark Payment as REJECTED
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "REJECTED" },
      });
      // 2. Mark Reservation as REJECTED
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { status: "REJECTED" },
      });
      // 3. Return Tickets to pool
      const ticketIds = payment.reservation.tickets.map((t) => t.id);
      await prisma.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: { status: "AVAILABLE", reservationId: null },
      });
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/payment/${payment.reservationId}`);
    revalidatePath("/receipt");
    return { success: true };
  } catch (err) {
    console.error("Payment verification error:", err);
    return { success: false, error: "Failed to verify payment" };
  }
}
