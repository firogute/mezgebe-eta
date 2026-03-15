export type PaymentProofData = {
  receiptImageUrl?: string;
  referenceLink?: string;
  verifier?: {
    source: "leul";
    verifiedPaid: boolean;
    provider?: string | null;
    statusText?: string | null;
    payerName?: string | null;
    payerAccount?: string | null;
    creditedPartyName?: string | null;
    creditedPartyAccount?: string | null;
    verifiedAmount?: number | null;
    verifiedCurrency?: string | null;
    totalPaidAmount?: number | null;
    serviceFee?: number | null;
    paymentDate?: string | null;
    verifierReference?: string | null;
  };
};

const PAYMENT_PROOF_VERSION = 1;

export function serializePaymentProof(data: PaymentProofData) {
  return JSON.stringify({
    version: PAYMENT_PROOF_VERSION,
    receiptImageUrl: data.receiptImageUrl || null,
    referenceLink: data.referenceLink || null,
    verifier: data.verifier || null,
  });
}

export function parsePaymentProof(rawProofUrl: string | null) {
  if (!rawProofUrl) {
    return { receiptImageUrl: null, referenceLink: null, verifier: null };
  }

  try {
    const parsed = JSON.parse(rawProofUrl) as {
      receiptImageUrl?: string | null;
      referenceLink?: string | null;
      verifier?: PaymentProofData["verifier"] | null;
    };

    return {
      receiptImageUrl: parsed.receiptImageUrl || null,
      referenceLink: parsed.referenceLink || null,
      verifier: parsed.verifier || null,
    };
  } catch {
    // Backward compatibility for legacy plain-string proof URLs.
    const isImageLink =
      rawProofUrl.startsWith("http") &&
      rawProofUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;

    return {
      receiptImageUrl: isImageLink ? rawProofUrl : null,
      referenceLink: isImageLink ? null : rawProofUrl,
      verifier: null,
    };
  }
}
