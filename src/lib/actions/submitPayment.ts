"use server";

import prisma from "../prisma";
import { serializePaymentProof } from "../paymentProof";
import {
  extractLeulReference,
  verifyPaymentLinkWithLeul,
} from "../leulVerifier";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatBirr(value: number) {
  return `${roundCurrency(value).toLocaleString()} Birr`;
}

function shouldFallbackToManualReview(reason: string | null) {
  if (!reason) {
    return false;
  }

  return /invalid api key|not configured|could not reach payment verifier service/i.test(
    reason,
  );
}

export async function submitPayment(data: {
  reservationId: string;
  method: string;
  receiptImageUrl: string;
  referenceLink?: string;
}) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: {
        tickets: {
          include: {
            event: {
              select: {
                ticketPrice: true,
              },
            },
          },
        },
      },
    });

    if (!reservation || reservation.status !== "PENDING") {
      return { success: false, error: "Invalid or expired reservation." };
    }

    const expectedTicketPrice = reservation.tickets[0]?.event?.ticketPrice;
    const expectedAmount =
      typeof expectedTicketPrice === "number"
        ? roundCurrency(reservation.tickets.length * expectedTicketPrice)
        : null;

    let verifierProof:
      | {
          source: "leul";
          verifiedPaid: boolean;
          provider?: string | null;
          statusText?: string | null;
          payerName?: string | null;
          payerAccount?: string | null;
          creditedPartyName?: string | null;
          creditedPartyAccount?: string | null;
          verifierReference?: string | null;
          verifiedAmount?: number | null;
          verifiedCurrency?: string | null;
          totalPaidAmount?: number | null;
          serviceFee?: number | null;
          paymentDate?: string | null;
        }
      | undefined;

    const trimmedReferenceLink = data.referenceLink?.trim();
    if (trimmedReferenceLink) {
      const verification = await verifyPaymentLinkWithLeul(
        trimmedReferenceLink,
        data.method,
      );
      if (!verification.paid) {
        if (shouldFallbackToManualReview(verification.reason)) {
          console.warn(
            "Payment verifier unavailable during submission; falling back to manual review.",
            verification.reason,
          );
        } else {
          return {
            success: false,
            error:
              verification.reason ||
              "Payment link verification failed. Please check your link.",
          };
        }
      }

      if (verification.paid) {
        if (expectedAmount === null) {
          return {
            success: false,
            error:
              "Could not calculate the expected ticket total for verification.",
          };
        }

        if (verification.amount === null) {
          return {
            success: false,
            error:
              "Payment was found, but the verifier did not return the paid amount. Please use a link that includes the payment amount or ask admin to review it manually.",
          };
        }

        const verifiedAmount = roundCurrency(verification.amount);
        if (verifiedAmount !== expectedAmount) {
          return {
            success: false,
            error: `Paid amount mismatch. Expected ${formatBirr(expectedAmount)}, but verifier returned ${formatBirr(verifiedAmount)}.`,
          };
        }

        const reference =
          verification.reference ||
          extractLeulReference(trimmedReferenceLink, data.method);
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
          payerName: verification.payerName,
          payerAccount: verification.payerAccount,
          creditedPartyName: verification.creditedPartyName,
          creditedPartyAccount: verification.creditedPartyAccount,
          verifiedAmount: verifiedAmount,
          verifiedCurrency: verification.currency,
          totalPaidAmount: verification.totalPaidAmount,
          serviceFee: verification.serviceFee,
          paymentDate: verification.paymentDate,
          verifierReference: reference,
        };
      }
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
