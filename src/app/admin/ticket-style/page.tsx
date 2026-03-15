import { getTicketTemplateConfig } from "@/lib/ticketTemplate";
import { TicketStyleEditor } from "./TicketStyleEditor";

export default async function TicketStylePage() {
  const initialConfig = await getTicketTemplateConfig();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
          Admin Design Controls
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Ticket Style Editor
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Customize the verified ticket design that users download as PNG or PDF
          after payment approval.
        </p>
      </div>

      <TicketStyleEditor initialConfig={initialConfig} />
    </div>
  );
}
