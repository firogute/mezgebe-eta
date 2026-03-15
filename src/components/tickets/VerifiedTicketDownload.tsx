"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Download, FileImage, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { type TicketTemplateConfig } from "@/lib/ticketTemplateConfig";

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function VerifiedTicketDownload({
  eventTitle,
  username,
  phoneNumber,
  ticketNumbers,
  ticketPrice,
  cutDate,
  template,
}: {
  eventTitle: string;
  username: string;
  phoneNumber?: string | null;
  ticketNumbers: string[];
  ticketPrice: number;
  cutDate: string | Date;
  template: TicketTemplateConfig;
}) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [activeType, setActiveType] = useState<"png" | "pdf" | null>(null);
  const [error, setError] = useState("");
  const currentDate = new Date();
  const totalPrice = ticketNumbers.length * ticketPrice;
  const safeEventTitle = sanitizeFileName(eventTitle || "ticket");

  async function generateImage() {
    if (!ticketRef.current) {
      throw new Error("Ticket preview is not ready yet.");
    }

    return toPng(ticketRef.current, {
      cacheBust: true,
      pixelRatio: 2.5,
      backgroundColor: template.backgroundColor,
    });
  }

  async function handleDownload(type: "png" | "pdf") {
    setActiveType(type);
    setError("");

    try {
      const imageData = await generateImage();

      if (type === "png") {
        const anchor = document.createElement("a");
        anchor.href = imageData;
        anchor.download = `${safeEventTitle}-verified-ticket.png`;
        anchor.click();
      } else {
        const image = new Image();
        image.src = imageData;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error("Failed to prepare PDF export."));
        });

        const pdf = new jsPDF({
          orientation: image.width > image.height ? "landscape" : "portrait",
          unit: "px",
          format: [image.width, image.height],
        });
        pdf.addImage(imageData, "PNG", 0, 0, image.width, image.height);
        pdf.save(`${safeEventTitle}-verified-ticket.pdf`);
      }
    } catch (downloadError) {
      console.error(downloadError);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download verified ticket.",
      );
    } finally {
      setActiveType(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Verified Ticket Download
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Export this approved ticket as an image or PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleDownload("png")}
            disabled={activeType !== null}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted disabled:opacity-60"
          >
            {activeType === "png" ? (
              <LoadingSpinner />
            ) : (
              <FileImage className="h-4 w-4" />
            )}
            PNG
          </button>
          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={activeType !== null}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
          >
            {activeType === "pdf" ? (
              <LoadingSpinner />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      <div
        ref={ticketRef}
        className="relative overflow-hidden rounded-4xl border p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
        style={{
          background: `linear-gradient(145deg, ${template.backgroundColor}, ${template.accentSoftColor})`,
          borderColor: template.borderColor,
          color: template.textColor,
        }}
      >
        <div
          className="absolute -right-10.5 top-12 rotate-30 text-6xl font-black opacity-10"
          style={{ color: template.accentColor }}
        >
          {template.watermarkText}
        </div>

        <div
          className="rounded-[28px] border p-5"
          style={{
            backgroundColor: template.panelColor,
            borderColor: template.borderColor,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: template.mutedTextColor }}
              >
                {template.templateName}
              </p>
              <h3 className="mt-3 text-3xl font-bold">
                {template.headerTitle}
              </h3>
              <p
                className="mt-2 max-w-xl text-sm leading-6"
                style={{ color: template.mutedTextColor }}
              >
                {template.subheading}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: template.accentColor }}
            >
              <Download className="h-3.5 w-3.5" />
              {template.badgeLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: `${template.accentSoftColor}44` }}
            >
              <p
                className="text-xs uppercase"
                style={{ color: template.mutedTextColor }}
              >
                Event
              </p>
              <p className="mt-2 text-xl font-semibold">{eventTitle}</p>
              <div className="mt-4">
                <p
                  className="text-xs uppercase"
                  style={{ color: template.mutedTextColor }}
                >
                  Ticket Numbers
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ticketNumbers.map((ticketNumber) => (
                    <span
                      key={ticketNumber}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: template.borderColor }}
                    >
                      {ticketNumber}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: `${template.accentSoftColor}44` }}
            >
              <p
                className="text-xs uppercase"
                style={{ color: template.mutedTextColor }}
              >
                Issued For
              </p>
              <p className="mt-2 text-xl font-semibold">@{username}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <p style={{ color: template.mutedTextColor }}>Phone</p>
                  <p className="mt-1 font-semibold">
                    {phoneNumber || "Not available"}
                  </p>
                </div>
                <div>
                  <p style={{ color: template.mutedTextColor }}>Price</p>
                  <p className="mt-1 font-semibold">
                    {totalPrice.toLocaleString()} Birr
                  </p>
                </div>
                <div>
                  <p style={{ color: template.mutedTextColor }}>
                    Ticket Cut Date
                  </p>
                  <p className="mt-1 font-semibold">
                    {new Date(cutDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: template.mutedTextColor }}>Current Date</p>
                  <p className="mt-1 font-semibold">
                    {currentDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p
                className="text-xs uppercase"
                style={{ color: template.mutedTextColor }}
              >
                Notes
              </p>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: template.mutedTextColor }}
              >
                {template.footerText}
              </p>
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-right"
              style={{ backgroundColor: `${template.accentColor}12` }}
            >
              <p
                className="text-xs uppercase"
                style={{ color: template.mutedTextColor }}
              >
                Quantity
              </p>
              <p
                className="mt-1 text-2xl font-semibold"
                style={{ color: template.accentColor }}
              >
                {ticketNumbers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
