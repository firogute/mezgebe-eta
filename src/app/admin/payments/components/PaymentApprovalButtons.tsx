"use client";

import { useState, useTransition } from "react";
import { verifyPayment } from "@/lib/actions/payment";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function PaymentApprovalButtons({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"APPROVE" | "REJECT" | null>(
    null,
  );
  const router = useRouter();

  function handleAction(action: "APPROVE" | "REJECT") {
    setActiveAction(action);
    startTransition(async () => {
      await verifyPayment(paymentId, action);
      router.refresh();
      setActiveAction(null);
    });
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleAction("APPROVE")}
        disabled={isPending}
        className="flex-1 bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {isPending && activeAction === "APPROVE" ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : (
          "Approve"
        )}
      </button>
      <button
        onClick={() => handleAction("REJECT")}
        disabled={isPending}
        className="flex-1 bg-red-100 text-red-700 py-2 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {isPending && activeAction === "REJECT" ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : (
          "Reject"
        )}
      </button>
    </div>
  );
}
