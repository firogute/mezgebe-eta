"use server";

import { revalidatePath } from "next/cache";
import { saveTicketTemplateConfig } from "@/lib/ticketTemplate";
import { type TicketTemplateConfig } from "@/lib/ticketTemplateConfig";

export async function updateTicketTemplateAction(config: TicketTemplateConfig) {
  try {
    const saved = await saveTicketTemplateConfig(config);
    revalidatePath("/admin/ticket-style");
    revalidatePath("/receipt");
    return { success: true, config: saved };
  } catch (error) {
    console.error("Failed to update ticket template", error);
    return {
      success: false,
      error: "Failed to save ticket template settings.",
    };
  }
}
