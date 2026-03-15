"use server";

import prisma from "../prisma";
import { serializePaymentProof } from "../paymentProof";
import {
  extractLeulReference,
  verifyPaymentLinkWithLeul,
} from "../leulVerifier";

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

    let verifierProof:
      | {
          source: "leul";
          verifiedPaid: boolean;
          provider?: string | null;
          statusText?: string | null;
          verifierReference?: string | null;
        }
      | undefined;

    const trimmedReferenceLink = data.referenceLink?.trim();
    if (trimmedReferenceLink) {
      const verification =
        await verifyPaymentLinkWithLeul(trimmedReferenceLink);
      if (!verification.paid) {
        return {
          success: false,
          error:
            verification.reason ||
            "Payment link verification failed. Please check your link.",
        };
      }

      const reference =
        verification.reference || extractLeulReference(trimmedReferenceLink);
      if (reference) {
        const duplicateReference = await prisma.payment.findFirst({
          where: {
            reservationId: { not: data.reservationId },
            status: { in: ["PENDING", "VERIFIED"] },
            proofUrl: {
              contains: `\"verifierReference\":\"${reference}\"`,
            },
          },
          select: { id: true },
        });

        if (duplicateReference) {
          return {
            success: false,
            error:
              "This payment reference was already used for another ticket purchase.",
          };
        }
      }

      verifierProof = {
        source: "leul",
        verifiedPaid: true,
        provider: verification.provider,
        statusText: verification.statusText,
        verifierReference: reference,
      };
    }

    await prisma.payment.create({
      data: {
        reservationId: data.reservationId,
        method: data.method,
        proofUrl: serializePaymentProof({
          receiptImageUrl: data.receiptImageUrl,
          referenceLink: trimmedReferenceLink,
          verifier: verifierProof,
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
