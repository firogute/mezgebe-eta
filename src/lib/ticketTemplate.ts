import { promises as fs } from "fs";
import path from "path";
import {
  defaultTicketTemplateConfig,
  type TicketTemplateConfig,
} from "./ticketTemplateConfig";

const templateFilePath = path.join(
  process.cwd(),
  "data",
  "ticket-template.json",
);

function normalizeConfig(
  input: Partial<TicketTemplateConfig> | null | undefined,
): TicketTemplateConfig {
  const merged = {
    ...defaultTicketTemplateConfig,
    ...(input || {}),
  };

  return {
    templateName:
      merged.templateName.trim() || defaultTicketTemplateConfig.templateName,
    headerTitle:
      merged.headerTitle.trim() || defaultTicketTemplateConfig.headerTitle,
    subheading:
      merged.subheading.trim() || defaultTicketTemplateConfig.subheading,
    footerText:
      merged.footerText.trim() || defaultTicketTemplateConfig.footerText,
    badgeLabel:
      merged.badgeLabel.trim() || defaultTicketTemplateConfig.badgeLabel,
    watermarkText:
      merged.watermarkText.trim() || defaultTicketTemplateConfig.watermarkText,
    backgroundColor: merged.backgroundColor,
    panelColor: merged.panelColor,
    accentColor: merged.accentColor,
    accentSoftColor: merged.accentSoftColor,
    textColor: merged.textColor,
    mutedTextColor: merged.mutedTextColor,
    borderColor: merged.borderColor,
  };
}

async function ensureTemplateFile() {
  await fs.mkdir(path.dirname(templateFilePath), { recursive: true });

  try {
    await fs.access(templateFilePath);
  } catch {
    await fs.writeFile(
      templateFilePath,
      `${JSON.stringify(defaultTicketTemplateConfig, null, 2)}\n`,
      "utf8",
    );
  }
}

export async function getTicketTemplateConfig(): Promise<TicketTemplateConfig> {
  await ensureTemplateFile();

  try {
    const raw = await fs.readFile(templateFilePath, "utf8");
    return normalizeConfig(JSON.parse(raw) as Partial<TicketTemplateConfig>);
  } catch (error) {
    console.error("Failed to read ticket template config", error);
    return defaultTicketTemplateConfig;
  }
}

export async function saveTicketTemplateConfig(
  config: TicketTemplateConfig,
): Promise<TicketTemplateConfig> {
  await ensureTemplateFile();
  const normalized = normalizeConfig(config);
  await fs.writeFile(
    templateFilePath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
  return normalized;
}
