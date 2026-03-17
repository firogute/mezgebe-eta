"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEtaEventAdmin } from "@/lib/actions/admin";
import { endEvent, runLottery } from "@/lib/actions/lottery";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAdminToast } from "@/app/admin/components/AdminToastProvider";

export function EtaEventActions({
  eventId,
  eventStatus,
  compact = false,
}: {
  eventId: string;
  eventStatus: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useAdminToast();

  function handleEndEvent() {
    const confirmed = window.confirm(
      "End this ETA event? This will mark it as ended and run the lottery.",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await endEvent(eventId);
      if (!result.success) {
        setError(result.error || "Failed to end event.");
        showToast(result.error || "Failed to end event.", "error");
        return;
      }
      showToast("Event ended and lottery completed successfully.", "success");
      router.refresh();
    });
  }

  function handleRunLottery() {
    const confirmed = window.confirm(
      "Run lottery for this event? This will randomly select winners.",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await runLottery(eventId);
      if (!result.success) {
        setError(result.error || "Failed to run lottery.");
        showToast(result.error || "Failed to run lottery.", "error");
        return;
      }
      showToast(
        `Lottery completed! ${result.winnerCount} winner(s) selected.`,
        "success",
      );
      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this ETA event? This is blocked if tickets are already reserved/sold.",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await deleteEtaEventAdmin({ eventId });
      if (!result.success) {
        setError(result.error || "Failed to delete event.");
        showToast(result.error || "Failed to delete event.", "error");
        return;
      }
      showToast("Event deleted successfully.", "success");
      router.refresh();
      router.push("/admin");
    });
  }

  const sizeClasses = compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/admin/eta/${eventId}/edit`}
          className={`${sizeClasses} rounded-md border border-border hover:bg-muted transition-colors`}
        >
          Edit
        </Link>

        {eventStatus === "ACTIVE" && (
          <button
            type="button"
            onClick={handleEndEvent}
            disabled={isPending}
            className={`${sizeClasses} rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50 inline-flex items-center gap-2`}
          >
            {isPending ? (
              <>
                <LoadingSpinner />
                Ending...
              </>
            ) : (
              "End Event"
            )}
          </button>
        )}

        {(eventStatus === "ACTIVE" || eventStatus === "ENDED") && (
          <button
            type="button"
            onClick={handleRunLottery}
            disabled={isPending}
            className={`${sizeClasses} rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 inline-flex items-center gap-2`}
          >
            {isPending ? (
              <>
                <LoadingSpinner />
                Running...
              </>
            ) : (
              "Run Lottery"
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={`${sizeClasses} rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 inline-flex items-center gap-2`}
        >
          {isPending ? (
            <>
              <LoadingSpinner />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
