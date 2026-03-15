"use server";

import prisma from "../prisma";
import { serializePaymentProof } from "../paymentProof";

export async function submitPayment(data: {
  reservationId: string;
  method: string;
  receiptImageUrl: string;
  referenceLink?: string;
}) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
    });

    if (!reservation || reservation.status !== "PENDING") {
      return { success: false, error: "Invalid or expired reservation." };
    }

    await prisma.payment.create({
      data: {
        reservationId: data.reservationId,
        method: data.method,
        proofUrl: serializePaymentProof({
          receiptImageUrl: data.receiptImageUrl,
          referenceLink: data.referenceLink,
        }),
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Payment submit error:", err);
    return { success: false, error: "Failed to submit payment" };
  }
}
