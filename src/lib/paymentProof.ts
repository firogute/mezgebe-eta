export type PaymentProofData = {
  receiptImageUrl?: string;
  referenceLink?: string;
};

const PAYMENT_PROOF_VERSION = 1;

export function serializePaymentProof(data: PaymentProofData) {
  return JSON.stringify({
    version: PAYMENT_PROOF_VERSION,
    receiptImageUrl: data.receiptImageUrl || null,
    referenceLink: data.referenceLink || null,
  });
}

export function parsePaymentProof(rawProofUrl: string | null) {
  if (!rawProofUrl) {
    return { receiptImageUrl: null, referenceLink: null };
  }

  try {
    const parsed = JSON.parse(rawProofUrl) as {
      receiptImageUrl?: string | null;
      referenceLink?: string | null;
    };

    return {
      receiptImageUrl: parsed.receiptImageUrl || null,
      referenceLink: parsed.referenceLink || null,
    };
  } catch {
    // Backward compatibility for legacy plain-string proof URLs.
    const isImageLink =
      rawProofUrl.startsWith("http") &&
      rawProofUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;

    return {
      receiptImageUrl: isImageLink ? rawProofUrl : null,
      referenceLink: isImageLink ? null : rawProofUrl,
    };
  }
}
