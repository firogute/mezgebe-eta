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
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
