"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEtaEventAdmin } from "@/lib/actions/admin";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";

const BANK_TYPE_OPTIONS = [
  "Telebirr",
  "CBE",
  "CBE Birr",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Awash Bank",
  "M-Pesa",
  "Amole",
  "Other",
];

type EditEtaEventFormProps = {
  eventId: string;
  initialTitle: string;
  initialDescriptionEn: string;
  initialTicketPrice: number;
  initialWinnerCount: number;
  initialDeadlineValue: string;
  initialBankType?: string | null;
  initialAccountName?: string | null;
  initialAccountNumber?: string | null;
  initialImage?: string | null;
};

export default function EditEtaEventForm(props: EditEtaEventFormProps) {
  const [title, setTitle] = useState(props.initialTitle);
  const [descriptionEn, setDescriptionEn] = useState(
    props.initialDescriptionEn,
  );
  const [ticketPrice, setTicketPrice] = useState(
    String(props.initialTicketPrice),
  );
  const [winnerCount, setWinnerCount] = useState(
    String(props.initialWinnerCount),
  );
  const [deadline, setDeadline] = useState(props.initialDeadlineValue);
  const [bankType, setBankType] = useState(props.initialBankType || "");
  const [accountName, setAccountName] = useState(
    props.initialAccountName || "",
  );
  const [accountNumber, setAccountNumber] = useState(
    props.initialAccountNumber || "",
  );
  const [image, setImage] = useState(props.initialImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useToast();
  const normalizedBankType = bankType.trim();
  const shouldShowCustomBankTypeOption =
    normalizedBankType.length > 0 &&
    !BANK_TYPE_OPTIONS.includes(normalizedBankType);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await updateEtaEventAdmin({
      eventId: props.eventId,
      title,
      descriptionEn,
      ticketPrice: parseFloat(ticketPrice),
      winnerCount: parseInt(winnerCount),
      deadline: new Date(deadline),
      bankType,
      accountName,
      accountNumber,
      image: image || undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to update event.");
      showToast(result.error || "Failed to update event.", "error");
      setLoading(false);
      return;
    }

    showToast("Event updated successfully.", "success");
    router.push(`/admin/eta/${props.eventId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <p className="mb-2 text-xs text-muted-foreground">
          English text will be translated to Amharic automatically. Amharic text
          will be kept as-is.
        </p>
        <textarea
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          required
          rows={4}
          className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Ticket Price (Birr)
          </label>
          <input
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            type="number"
            min="1"
            required
            className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Number of Winners
          </label>
          <input
            value={winnerCount}
            onChange={(e) => setWinnerCount(e.target.value)}
            type="number"
            min="1"
            required
            className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            type="datetime-local"
            required
            className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          Payment Account Details
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bank Type</label>
            <select
              value={bankType}
              onChange={(e) => setBankType(e.target.value)}
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            >
              {shouldShowCustomBankTypeOption && (
                <option value={normalizedBankType}>{normalizedBankType}</option>
              )}
              {BANK_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Account Name
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Account Number
          </label>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image URL (Optional)
        </label>
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          type="url"
          placeholder="https://..."
          className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Saving Changes...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
}
