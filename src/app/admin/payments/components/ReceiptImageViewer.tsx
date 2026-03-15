"use client";

import Image from "next/image";
import { useState } from "react";

export function ReceiptImageViewer({ imageUrl }: { imageUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left"
      >
        <Image
          src={imageUrl}
          alt="Payment Receipt"
          width={640}
          height={256}
          className="rounded-md border border-border max-h-48 w-full object-cover"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Click image to enlarge
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-card border border-border"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-md bg-black/70 text-white px-3 py-1 text-sm"
            >
              Close
            </button>

            <div className="relative w-full h-[80vh] bg-black">
              <Image
                src={imageUrl}
                alt="Payment Receipt Enlarged"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
