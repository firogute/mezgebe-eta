const DEFAULT_LEUL_VERIFY_BASE_URL = "https://verifyapi.leulzenebe.pro";

type VerificationPayload = {
  reference: string;
  suffix?: string;
  phoneNumber?: string;
};

type LeulVerificationOutput = {
  paid: boolean;
  reference: string;
  provider: string | null;
  statusText: string | null;
  amount: number | null;
  currency: string | null;
  totalPaidAmount: number | null;
  serviceFee: number | null;
  payerName: string | null;
  payerAccount: string | null;
  creditedPartyName: string | null;
  creditedPartyAccount: string | null;
  paymentDate: string | null;
  reason: string | null;
};

const COMMON_REFERENCE_KEYS = [
  "reference",
  "ref",
  "txn",
  "tx",
  "trx",
  "transaction",
  "transactionId",
  "transaction_id",
  "txRef",
  "tx_ref",
  "receipt",
  "receiptNumber",
  "receipt_number",
  "orderId",
  "order_id",
  "paymentId",
  "payment_id",
  "invoice",
  "invoiceId",
  "invoice_id",
  "sessionId",
  "session_id",
  "rrn",
  "transId",
  "transactionNo",
  "traceNo",
  "outTradeNo",
] as const;

const METHOD_REFERENCE_KEYS: Record<string, string[]> = {
  telebirr: ["outTradeNo", "merchantOrderNo", "prepayId"],
  cbe: ["transId", "transactionNo", "traceNo", "rrn"],
  cbebirr: ["transId", "transactionNo", "traceNo", "rrn"],
  dashen: ["transactionReference", "transaction_ref", "rrn"],
  abyssinia: ["transactionReference", "clientReference", "rrn"],
  mpesa: ["CheckoutRequestID", "MpesaReceiptNumber", "MerchantRequestID"],
};

const IGNORED_PATH_SEGMENTS = new Set([
  "pay",
  "payment",
  "payments",
  "receipt",
  "receipts",
  "result",
  "success",
  "status",
  "verify",
  "checkout",
  "transaction",
  "transactions",
  "app",
  "mobile",
  "web",
  "portal",
]);

const LEUL_ENDPOINT_BY_METHOD: Record<string, string> = {
  telebirr: "/verify-telebirr",
  cbe: "/verify-cbe",
  cbebirr: "/verify-cbebirr",
  dashen: "/verify-dashen",
  abyssinia: "/verify-abyssinia",
  mpesa: "/verify-mpesa",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function readBooleanField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (
        ["true", "verified", "paid", "success", "successful"].includes(
          normalized,
        )
      ) {
        return true;
      }
      if (["false", "unpaid", "failed", "error"].includes(normalized)) {
        return false;
      }
    }
  }
  return null;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readNumberField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const parsed = parseNumericValue(record[key]);
    if (typeof parsed === "number") {
      return parsed;
    }
  }

  return null;
}

function normalizeStatusToPaid(status: string | null) {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toLowerCase();
  if (
    ["paid", "success", "successful", "verified", "completed"].includes(
      normalized,
    )
  ) {
    return true;
  }
  if (
    ["pending", "failed", "rejected", "cancelled", "error", "unpaid"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return null;
}

function normalizeReferenceCandidate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/[\s/]+/g, "");
  if (normalized.length < 6) {
    return null;
  }

  return normalized;
}

function getSearchParamValue(url: URL, keys: readonly string[]) {
  for (const key of keys) {
    const value = normalizeReferenceCandidate(url.searchParams.get(key));
    if (value) {
      return value;
    }
  }

  return null;
}

function getHashParamValue(url: URL, keys: readonly string[]) {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (!hash || !hash.includes("=")) {
    return null;
  }

  const hashParams = new URLSearchParams(hash);
  for (const key of keys) {
    const value = normalizeReferenceCandidate(hashParams.get(key));
    if (value) {
      return value;
    }
  }

  return null;
}

function getPathReference(url: URL) {
  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    const lowerSegment = segment.toLowerCase();

    if (IGNORED_PATH_SEGMENTS.has(lowerSegment)) {
      continue;
    }

    const directCandidate = normalizeReferenceCandidate(segment);
    if (directCandidate) {
      return directCandidate;
    }

    const tokenCandidate = segment
      .split(/[^a-zA-Z0-9_-]+/)
      .map((token) => normalizeReferenceCandidate(token))
      .find((token): token is string => Boolean(token));

    if (tokenCandidate) {
      return tokenCandidate;
    }
  }

  return null;
}

function extractVerificationPayload(
  link: string,
  paymentMethod?: string,
): VerificationPayload | null {
  try {
    const url = new URL(link);
    const normalizedMethod = normalizeMethodKey(paymentMethod);
    const methodKeys = METHOD_REFERENCE_KEYS[normalizedMethod] || [];
    const allKeys = [...methodKeys, ...COMMON_REFERENCE_KEYS];

    const reference =
      getSearchParamValue(url, allKeys) ||
      getHashParamValue(url, allKeys) ||
      getPathReference(url);
    if (!reference) {
      return null;
    }

    const suffix =
      url.searchParams.get("suffix") ||
      url.searchParams.get("accountSuffix") ||
      undefined;
    const phoneNumber =
      url.searchParams.get("phone") ||
      url.searchParams.get("phoneNumber") ||
      url.searchParams.get("msisdn") ||
      undefined;

    return {
      reference,
      ...(suffix ? { suffix } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
    };
  } catch {
    return null;
  }
}

export function extractLeulReference(link: string, paymentMethod?: string) {
  return extractVerificationPayload(link, paymentMethod)?.reference || null;
}

function normalizeMethodKey(paymentMethod: string | undefined) {
  if (!paymentMethod) {
    return "";
  }

  return paymentMethod.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getLeulVerifyEndpoint(paymentMethod: string | undefined) {
  const normalizedMethod = normalizeMethodKey(paymentMethod);

  return LEUL_ENDPOINT_BY_METHOD[normalizedMethod] || "/verify";
}

export async function verifyPaymentLinkWithLeul(
  paymentLink: string,
  paymentMethod?: string,
): Promise<LeulVerificationOutput> {
  const payload = extractVerificationPayload(paymentLink, paymentMethod);
  if (!payload) {
    return {
      paid: false,
      reference: "",
      provider: null,
      statusText: null,
      amount: null,
      currency: null,
      totalPaidAmount: null,
      serviceFee: null,
      payerName: null,
      payerAccount: null,
      creditedPartyName: null,
      creditedPartyAccount: null,
      paymentDate: null,
      reason: "Invalid payment link. Could not extract payment reference.",
    };
  }

  const apiKey =
    process.env.LEUL_VERIFY_API_KEY?.trim() ||
    process.env.VERIFY_API_KEY?.trim();
  if (!apiKey) {
    return {
      paid: false,
      reference: payload.reference,
      provider: null,
      statusText: null,
      amount: null,
      currency: null,
      totalPaidAmount: null,
      serviceFee: null,
      payerName: null,
      payerAccount: null,
      creditedPartyName: null,
      creditedPartyAccount: null,
      paymentDate: null,
      reason:
        "Payment verification is not configured. Add LEUL_VERIFY_API_KEY in environment.",
    };
  }

  const baseUrl =
    process.env.LEUL_VERIFY_BASE_URL?.trim() || DEFAULT_LEUL_VERIFY_BASE_URL;
  const endpoint = getLeulVerifyEndpoint(paymentMethod);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = (await response.json().catch(() => null)) as unknown;
    const root = isRecord(raw) ? raw : {};
    const data = isRecord(root.data) ? root.data : root;

    const provider = readStringField(data, ["provider", "bank", "service"]);
    const statusText = readStringField(data, [
      "status",
      "paymentStatus",
      "state",
      "transactionStatus",
    ]);
    const amount =
      readNumberField(data, [
        "settledAmount",
        "amount",
        "paidAmount",
        "paymentAmount",
        "totalAmount",
        "total",
        "value",
        "totalPaidAmount",
      ]) ??
      readNumberField(root, [
        "settledAmount",
        "amount",
        "paidAmount",
        "paymentAmount",
        "totalAmount",
        "total",
        "value",
        "totalPaidAmount",
      ]);
    const totalPaidAmount =
      readNumberField(data, ["totalPaidAmount", "grossAmount"]) ??
      readNumberField(root, ["totalPaidAmount", "grossAmount"]);
    const serviceFee =
      readNumberField(data, ["serviceFee", "fee", "transactionFee"]) ??
      readNumberField(root, ["serviceFee", "fee", "transactionFee"]);
    const currency =
      readStringField(data, ["currency", "currencyCode"]) ||
      readStringField(root, ["currency", "currencyCode"]);
    const payerName = readStringField(data, ["payerName", "customerName"]);
    const payerAccount = readStringField(data, [
      "payerTelebirrNo",
      "payerAccountNo",
      "payerAccount",
      "phoneNumber",
      "msisdn",
    ]);
    const creditedPartyName = readStringField(data, [
      "creditedPartyName",
      "merchantName",
      "receiverName",
    ]);
    const creditedPartyAccount = readStringField(data, [
      "creditedPartyAccountNo",
      "merchantAccountNo",
      "receiverAccountNo",
    ]);
    const paymentDate = readStringField(data, [
      "paymentDate",
      "paidAt",
      "transactionDate",
      "date",
    ]);

    const boolHint =
      readBooleanField(data, ["verified", "isVerified", "paid", "isPaid"]) ??
      readBooleanField(root, [
        "verified",
        "isVerified",
        "paid",
        "isPaid",
        "success",
      ]);

    const statusHint = normalizeStatusToPaid(statusText);
    const paid =
      typeof boolHint === "boolean"
        ? boolHint
        : typeof statusHint === "boolean"
          ? statusHint
          : response.ok;

    const reason =
      readStringField(root, ["message", "error", "reason"]) ||
      readStringField(data, ["message", "error", "reason"]);

    return {
      paid,
      reference: payload.reference,
      provider: provider || paymentMethod || null,
      statusText,
      amount,
      currency,
      totalPaidAmount,
      serviceFee,
      payerName,
      payerAccount,
      creditedPartyName,
      creditedPartyAccount,
      paymentDate,
      reason: paid ? null : reason || "Payment is not verified as paid.",
    };
  } catch (error) {
    console.error("Leul verification failed", error);
    return {
      paid: false,
      reference: payload.reference,
      provider: null,
      statusText: null,
      amount: null,
      currency: null,
      totalPaidAmount: null,
      serviceFee: null,
      payerName: null,
      payerAccount: null,
      creditedPartyName: null,
      creditedPartyAccount: null,
      paymentDate: null,
      reason: "Could not reach payment verifier service.",
    };
  }
}
type VerifyResult = {
  success: boolean;
  duplicate: boolean;
  verified: boolean;
  status: string;
  message: string;
};

const VERIFY_BASE_URL =
  process.env.LEUL_VERIFY_BASE_URL || "https://verifyapi.leulzenebe.pro";

function looksLikeFailure(value: string) {
  return /(not\s+found|failed|invalid|error|unpaid|not\s+paid|does\s+not\s+exist)/i.test(
    value,
  );
}

function looksLikeSuccess(value: string) {
  return /(verified|success|paid|completed|valid|found|ok)/i.test(value);
}

function looksLikeDuplicate(value: string) {
  return /(duplicate|already\s+verified|already\s+paid|already\s+used|reused|previously\s+used)/i.test(
    value,
  );
}

function normalizeReference(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const candidates = [
      url.searchParams.get("reference"),
      url.searchParams.get("ref"),
      url.searchParams.get("transaction"),
      url.searchParams.get("trx"),
      url.searchParams.get("id"),
    ].filter((value): value is string => Boolean(value && value.trim()));

    if (candidates.length > 0) {
      return candidates[0].trim();
    }

    const fromPath = url.pathname.split("/").filter(Boolean).at(-1);

    if (fromPath) {
      return fromPath.trim();
    }
  } catch {
    // Input is not a URL. Keep the raw value.
  }

  return trimmed;
}

function parseVerificationResponse(data: unknown): VerifyResult {
  const asObject =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const statusValue =
    String(
      asObject.status || asObject.verificationStatus || asObject.state || "",
    ).trim() || "unknown";

  const messageValue = String(
    asObject.message || asObject.detail || asObject.error || "",
  ).trim();

  const combined =
    `${statusValue} ${messageValue} ${JSON.stringify(asObject)}`.trim();

  const explicitSuccess =
    asObject.success === true ||
    asObject.verified === true ||
    asObject.isPaid === true;

  const explicitFailure =
    asObject.success === false ||
    asObject.verified === false ||
    asObject.isPaid === false;

  const duplicate = looksLikeDuplicate(combined);

  let verified = explicitSuccess;
  if (!explicitSuccess && !explicitFailure) {
    verified = looksLikeSuccess(combined) && !looksLikeFailure(combined);
  }

  return {
    success: !explicitFailure,
    duplicate,
    verified,
    status: statusValue || "unknown",
    message: messageValue || combined || "Verification response received.",
  };
}

export async function verifyLeulPaymentReference(input: {
  referenceRaw: string;
  paymentMethod?: string;
}) {
  const apiKey =
    process.env.LEUL_VERIFY_API_KEY?.trim() ||
    process.env.VERIFY_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Payment verification is not configured. Add LEUL_VERIFY_API_KEY in server env.",
      normalizedReference: "",
    };
  }

  const normalizedReference = normalizeReference(input.referenceRaw);
  if (!normalizedReference) {
    return {
      ok: false,
      error: "Please provide a valid transaction reference.",
      normalizedReference: "",
    };
  }

  try {
    const endpoint = getLeulVerifyEndpoint(input.paymentMethod);
    const response = await fetch(`${VERIFY_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        reference: normalizedReference,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({}))) as unknown;
    const parsed = parseVerificationResponse(data);

    if (!response.ok) {
      return {
        ok: false,
        error:
          parsed.message ||
          "Verifier API request failed. Please check the reference and try again.",
        normalizedReference,
      };
    }

    if (!parsed.verified) {
      return {
        ok: false,
        error:
          parsed.message ||
          "Payment could not be verified as paid. Please submit a valid paid reference.",
        normalizedReference,
      };
    }

    if (parsed.duplicate) {
      return {
        ok: false,
        error:
          "This transaction reference appears to be already used/verified. Duplicate payment submission is blocked.",
        normalizedReference,
      };
    }

    return {
      ok: true,
      normalizedReference,
      verificationStatus: parsed.status,
      verificationMessage: parsed.message,
    };
  } catch (error) {
    console.error("Leul verification request failed", error);
    return {
      ok: false,
      error:
        "Could not reach payment verifier right now. Please try again in a moment.",
      normalizedReference,
    };
  }
}
