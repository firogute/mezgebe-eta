"use client";

import { useState, useTransition } from "react";
import { updateUserPhone } from "@/lib/actions/user";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { useToast } from "@/components/ui/ToastProvider";

export function PhoneNumberForm({
  username,
  initialPhone,
}: {
  username: string;
  initialPhone: string | null;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const isMissingPhone = !initialPhone;

  const onSave = () => {
    const normalizedPhone = normalizeEthiopianPhone(phone);

    if (!normalizedPhone) {
      setError(
        "Use a valid Ethiopian format: 09..., 07..., 2519..., 2517..., +2519..., or +2517....",
      );
      showToast("Please enter a valid phone number.", "error");
      setMessage("");
      return;
    }

    startTransition(async () => {
      const result = await updateUserPhone(username, normalizedPhone);

      if (!result.success) {
        setError(result.error || "Failed to update phone number.");
        showToast(result.error || "Failed to update phone number.", "error");
        setMessage("");
        return;
      }

      setPhone(result.phone || normalizedPhone);
      setError("");
      setMessage("Phone number saved.");
      showToast("Phone number saved.", "success");
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">
        {isMissingPhone ? "Phone Number Required" : "Update Phone Number"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Accepted formats: 09..., 07..., 2519..., 2517..., +2519..., +2517...
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setError("");
            setMessage("");
          }}
          placeholder="09... or +2519..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
    </div>
  );
}
