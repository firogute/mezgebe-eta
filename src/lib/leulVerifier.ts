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
  reason: string | null;
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

function extractVerificationPayload(link: string): VerificationPayload | null {
  try {
    const url = new URL(link);

    const refFromParams =
      url.searchParams.get("reference") ||
      url.searchParams.get("ref") ||
      url.searchParams.get("txn") ||
      url.searchParams.get("tx") ||
      url.searchParams.get("transaction") ||
      url.searchParams.get("transactionId") ||
      url.searchParams.get("receipt") ||
      url.searchParams.get("receiptNumber");

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastPathSegment = pathSegments[pathSegments.length - 1] || "";

    const reference = (refFromParams || lastPathSegment || "").trim();
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

export function extractLeulReference(link: string) {
  return extractVerificationPayload(link)?.reference || null;
}

export async function verifyPaymentLinkWithLeul(
  paymentLink: string,
): Promise<LeulVerificationOutput> {
  const payload = extractVerificationPayload(paymentLink);
  if (!payload) {
    return {
      paid: false,
      reference: "",
      provider: null,
      statusText: null,
      reason: "Invalid payment link. Could not extract payment reference.",
    };
  }

  const apiKey = process.env.LEUL_VERIFY_API_KEY;
  if (!apiKey) {
    return {
      paid: false,
      reference: payload.reference,
      provider: null,
      statusText: null,
      reason:
        "Payment verification is not configured. Add LEUL_VERIFY_API_KEY in environment.",
    };
  }

  const baseUrl =
    process.env.LEUL_VERIFY_BASE_URL?.trim() || DEFAULT_LEUL_VERIFY_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/verify`, {
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
      provider,
      statusText,
      reason: paid ? null : reason || "Payment is not verified as paid.",
    };
  } catch (error) {
    console.error("Leul verification failed", error);
    return {
      paid: false,
      reference: payload.reference,
      provider: null,
      statusText: null,
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
}) {
  const apiKey = process.env.LEUL_VERIFY_API_KEY || process.env.VERIFY_API_KEY;
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
    const response = await fetch(`${VERIFY_BASE_URL}/verify`, {
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
