"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import {
  createAdminNotification,
  createUserNotification,
} from "../notifications";

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

      await createUserNotification({
        userId: payment.reservation.userId,
        title: "Payment Approved",
        message:
          "Your payment was approved and your ticket is ready to download.",
        link: `/payment/${payment.reservationId}`,
      });

      await createAdminNotification({
        title: "Payment Approved",
        message: `Payment ${paymentId.slice(0, 8)} was approved successfully.`,
        link: "/admin/payments",
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

      await createUserNotification({
        userId: payment.reservation.userId,
        title: "Payment Rejected",
        message:
          "Your payment proof was rejected. Please submit a valid payment again.",
        link: `/payment/${payment.reservationId}`,
      });

      await createAdminNotification({
        title: "Payment Rejected",
        message: `Payment ${paymentId.slice(0, 8)} was rejected and tickets were released.`,
        link: "/admin/payments",
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
