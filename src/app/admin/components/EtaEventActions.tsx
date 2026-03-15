"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEtaEventAdmin } from "@/lib/actions/admin";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAdminToast } from "@/app/admin/components/AdminToastProvider";

export function EtaEventActions({
  eventId,
  compact = false,
}: {
  eventId: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useAdminToast();

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
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/eta/${eventId}/edit`}
          className={`${sizeClasses} rounded-md border border-border hover:bg-muted transition-colors`}
        >
          Edit
        </Link>
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
