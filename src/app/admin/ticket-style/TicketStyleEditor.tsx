"use client";

import { useState, useTransition } from "react";
import { updateTicketTemplateAction } from "@/lib/actions/ticketTemplate";
import {
  defaultTicketTemplateConfig,
  type TicketTemplateConfig,
} from "@/lib/ticketTemplateConfig";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const colorFields: Array<{
  key: keyof TicketTemplateConfig;
  label: string;
}> = [
  { key: "backgroundColor", label: "Background" },
  { key: "panelColor", label: "Card Panel" },
  { key: "accentColor", label: "Primary Accent" },
  { key: "accentSoftColor", label: "Secondary Accent" },
  { key: "textColor", label: "Main Text" },
  { key: "mutedTextColor", label: "Muted Text" },
  { key: "borderColor", label: "Border" },
];

export function TicketStyleEditor({
  initialConfig,
}: {
  initialConfig: TicketTemplateConfig;
}) {
  const [config, setConfig] = useState<TicketTemplateConfig>(initialConfig);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const sampleDate = new Date("2026-03-15T12:00:00Z");

  function updateField<K extends keyof TicketTemplateConfig>(
    key: K,
    value: TicketTemplateConfig[K],
  ) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleReset() {
    setConfig(defaultTicketTemplateConfig);
    setFeedback("");
  }

  function handleSave() {
    setFeedback("");
    startTransition(async () => {
      const result = await updateTicketTemplateAction(config);
      const savedConfig = result.success ? result.config : null;

      if (!savedConfig) {
        setFeedback(result.error || "Failed to save changes.");
        return;
      }

      setConfig(savedConfig);
      setFeedback("Ticket template updated.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Editor Controls
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update text, brand accents, and the overall ticket surface.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Reset
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Template Name</span>
              <input
                value={config.templateName}
                onChange={(event) =>
                  updateField("templateName", event.target.value)
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Badge Label</span>
              <input
                value={config.badgeLabel}
                onChange={(event) =>
                  updateField("badgeLabel", event.target.value)
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm block">
            <span className="font-medium text-foreground">Header Title</span>
            <input
              value={config.headerTitle}
              onChange={(event) =>
                updateField("headerTitle", event.target.value)
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="space-y-2 text-sm block">
            <span className="font-medium text-foreground">Subheading</span>
            <textarea
              value={config.subheading}
              onChange={(event) =>
                updateField("subheading", event.target.value)
              }
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Footer Text</span>
              <textarea
                value={config.footerText}
                onChange={(event) =>
                  updateField("footerText", event.target.value)
                }
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">
                Watermark Text
              </span>
              <textarea
                value={config.watermarkText}
                onChange={(event) =>
                  updateField("watermarkText", event.target.value)
                }
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Color System
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {colorFields.map((field) => (
                <label
                  key={field.key}
                  className="space-y-2 rounded-2xl border border-border bg-background/80 p-4 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {field.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config[field.key]}
                      onChange={(event) =>
                        updateField(field.key, event.target.value)
                      }
                      className="h-12 w-14 rounded-lg border border-border bg-transparent p-1"
                    />
                    <input
                      value={config[field.key]}
                      onChange={(event) =>
                        updateField(field.key, event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition-all duration-200 hover:scale-[1.01] hover:opacity-95 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <LoadingSpinner />
                Saving Style...
              </>
            ) : (
              "Save Ticket Style"
            )}
          </button>
          {feedback && (
            <p className="text-sm text-muted-foreground">{feedback}</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Live Preview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is the visual system users will download after verification.
            </p>
          </div>
        </div>

        <div
          className="relative mt-6 overflow-hidden rounded-[32px] border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
          style={{
            background: `linear-gradient(145deg, ${config.backgroundColor}, ${config.accentSoftColor})`,
            borderColor: config.borderColor,
            color: config.textColor,
          }}
        >
          <div
            className="absolute right-[-38px] top-10 rotate-[32deg] text-5xl font-black opacity-10"
            style={{ color: config.accentColor }}
          >
            {config.watermarkText}
          </div>

          <div
            className="rounded-[28px] border p-5"
            style={{
              backgroundColor: config.panelColor,
              borderColor: config.borderColor,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: config.mutedTextColor }}
                >
                  {config.templateName}
                </p>
                <h3 className="mt-3 text-2xl font-bold">
                  {config.headerTitle}
                </h3>
                <p
                  className="mt-2 max-w-sm text-sm leading-6"
                  style={{ color: config.mutedTextColor }}
                >
                  {config.subheading}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: config.accentColor }}
              >
                {config.badgeLabel}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${config.accentSoftColor}44` }}
              >
                <p
                  className="text-xs uppercase"
                  style={{ color: config.mutedTextColor }}
                >
                  Ticket Numbers
                </p>
                <p className="mt-2 text-lg font-semibold">
                  ETA-004-019, ETA-004-028
                </p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${config.accentSoftColor}44` }}
              >
                <p
                  className="text-xs uppercase"
                  style={{ color: config.mutedTextColor }}
                >
                  Issued For
                </p>
                <p className="mt-2 text-lg font-semibold">@mezgebe_guest</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: config.mutedTextColor }}>Cut Date</p>
                <p className="mt-1 font-semibold">
                  {sampleDate.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p style={{ color: config.mutedTextColor }}>Current Date</p>
                <p className="mt-1 font-semibold">
                  {sampleDate.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p style={{ color: config.mutedTextColor }}>Price</p>
                <p className="mt-1 font-semibold">1,200 Birr</p>
              </div>
              <div>
                <p style={{ color: config.mutedTextColor }}>Status</p>
                <p
                  className="mt-1 font-semibold"
                  style={{ color: config.accentColor }}
                >
                  Verified
                </p>
              </div>
            </div>

            <div
              className="mt-6 rounded-2xl border border-dashed p-4 text-sm leading-6"
              style={{
                borderColor: config.borderColor,
                color: config.mutedTextColor,
              }}
            >
              {config.footerText}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
