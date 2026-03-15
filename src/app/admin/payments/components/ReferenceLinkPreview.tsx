"use client";

import { useState } from "react";

export function ReferenceLinkPreview({
  referenceLink,
}: {
  referenceLink: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Preview link
        </button>
        <p className="break-all text-sm text-muted-foreground">
          {referenceLink}
        </p>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Reference Link Preview
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {referenceLink}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={referenceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-black/70 px-3 py-1.5 text-sm text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-background">
              <iframe
                src={referenceLink}
                title="Reference Link Preview"
                className="h-full w-full border-0"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Some bank pages block embedded previews. If the frame stays blank,
              use the Open in new tab button.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
