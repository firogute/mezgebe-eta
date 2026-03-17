import type { PaymentProofData } from "@/lib/paymentProof";

function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
) {
  if (typeof amount !== "number") {
    return null;
  }

  return `${amount.toLocaleString()} ${currency || "Birr"}`;
}

function extractPaidTime(paymentDate: string | null | undefined) {
  if (!paymentDate) {
    return null;
  }

  const trimmed = paymentDate.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return parts.slice(1).join(" ");
  }

  const isoDate = new Date(trimmed);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toLocaleTimeString();
  }

  return null;
}

function readOrFallback(value: string | null | undefined, fallback = "-") {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function maskAccount(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return "-";
  }

  // Preserve already-masked values from verifier responses.
  if (normalized.includes("*")) {
    return normalized;
  }

  const compact = normalized.replace(/\s+/g, "");
  if (compact.length <= 4) {
    return compact;
  }

  if (compact.length <= 8) {
    return `${compact.slice(0, 2)}****${compact.slice(-2)}`;
  }

  return `${compact.slice(0, 4)}****${compact.slice(-4)}`;
}

export function LeulVerificationDetails({
  verifier,
  title = "Leul Verification Details",
}: {
  verifier: PaymentProofData["verifier"] | null | undefined;
  title?: string;
}) {
  if (!verifier) {
    return null;
  }

  const paidTime = extractPaidTime(verifier.paymentDate);
  const statusValue = readOrFallback(
    verifier.statusText || (verifier.verifiedPaid ? "Completed" : "Pending"),
  );

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>

      <div className="grid gap-2 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">Provider:</span>{" "}
          {readOrFallback(verifier.provider || "Leul")}
        </p>
        <p>
          <span className="text-muted-foreground">Status:</span> {statusValue}
        </p>
        <p>
          <span className="text-muted-foreground">Payer Name:</span>{" "}
          {readOrFallback(verifier.payerName)}
        </p>
        <p>
          <span className="text-muted-foreground">Payer Account:</span>{" "}
          {maskAccount(verifier.payerAccount)}
        </p>
        <p>
          <span className="text-muted-foreground">Receiver:</span>{" "}
          {readOrFallback(verifier.creditedPartyName)}
        </p>
        <p>
          <span className="text-muted-foreground">Receiver Account:</span>{" "}
          {maskAccount(verifier.creditedPartyAccount)}
        </p>
        <p>
          <span className="text-muted-foreground">Settled Amount:</span>{" "}
          {formatMoney(verifier.verifiedAmount, verifier.verifiedCurrency) ||
            "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Service Fee:</span>{" "}
          {formatMoney(verifier.serviceFee, verifier.verifiedCurrency) || "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Total Paid:</span>{" "}
          {formatMoney(verifier.totalPaidAmount, verifier.verifiedCurrency) ||
            "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Payment Date:</span>{" "}
          {readOrFallback(verifier.paymentDate)}
        </p>
        <p>
          <span className="text-muted-foreground">Time Paid:</span>{" "}
          {readOrFallback(paidTime, "Not available")}
        </p>
        <p>
          <span className="text-muted-foreground">Reference:</span>{" "}
          {readOrFallback(verifier.verifierReference)}
        </p>
      </div>
    </div>
  );
}
