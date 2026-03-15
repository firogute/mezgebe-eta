const PHONE_SEPARATORS = /[\s\-()]/g;

function compactPhone(rawPhone: string) {
  return rawPhone.replace(PHONE_SEPARATORS, "").trim();
}

export function normalizeEthiopianPhone(rawPhone: string) {
  const compact = compactPhone(rawPhone);

  // Local prefixes: 09..., 07...
  if (/^0[97]\d{8,12}$/.test(compact)) {
    return `+251${compact.slice(1)}`;
  }

  // Country code without plus: 2519..., 2517...
  if (/^251[97]\d{8,12}$/.test(compact)) {
    return `+${compact}`;
  }

  // Country code with plus: +2519..., +2517...
  if (/^\+251[97]\d{8,12}$/.test(compact)) {
    return compact;
  }

  return null;
}

export function getEthiopianPhoneError(rawPhone: string) {
  if (!rawPhone.trim()) {
    return "Phone number is required.";
  }

  if (!normalizeEthiopianPhone(rawPhone)) {
    return "Use a valid Ethiopian phone format: 09..., 07..., 2519..., 2517..., +2519..., or +2517....";
  }

  return null;
}
