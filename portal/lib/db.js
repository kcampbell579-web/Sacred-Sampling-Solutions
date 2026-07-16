import { neon } from "@neondatabase/serverless";

// DATABASE_URL is required at runtime (set it in Vercel env vars).
// The placeholder only lets the app import/build without it; any real query
// without a valid DATABASE_URL will error clearly at request time.
const url = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost/placeholder";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set — set it in your environment before serving requests.");
}

export const sql = neon(url);
