export type TicketTemplateConfig = {
  templateName: string;
  headerTitle: string;
  subheading: string;
  footerText: string;
  badgeLabel: string;
  watermarkText: string;
  backgroundColor: string;
  panelColor: string;
  accentColor: string;
  accentSoftColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
};

export const defaultTicketTemplateConfig: TicketTemplateConfig = {
  templateName: "Classic Mezgebe Ticket",
  headerTitle: "Official Entry Ticket",
  subheading: "Verified payment ticket for Mezgebe ETA / Ixa",
  footerText:
    "Keep this ticket safe and present the exact ticket numbers when requested.",
  badgeLabel: "VERIFIED",
  watermarkText: "MEZGEBE",
  backgroundColor: "#f5f0e7",
  panelColor: "#fffaf2",
  accentColor: "#5c624d",
  accentSoftColor: "#d2b49c",
  textColor: "#2c2925",
  mutedTextColor: "#6b675f",
  borderColor: "#d8cfbf",
};
