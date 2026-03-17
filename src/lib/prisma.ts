import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Prisma");
}

// Provide a WebSocket implementation for environments where it is not global.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const prismaClientSingleton = () => {
  try {
    return new PrismaClient({ adapter } as any);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const adapterUnsupported = message.includes(
      '"adapter" property can only be provided',
    );

    if (!adapterUnsupported) {
      throw error;
    }

    console.warn(
      "Prisma adapter is unsupported by the current generated client; falling back to default PrismaClient.",
    );
    return new PrismaClient();
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
