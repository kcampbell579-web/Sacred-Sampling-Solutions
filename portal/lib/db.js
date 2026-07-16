import { neon } from "@neondatabase/serverless";

// Lazily create the Neon client so importing this module never fails the build.
// neon() is only called the first time a query actually runs (at request time),
// by which point DATABASE_URL is available in the Vercel runtime environment.
let _client = null;

function client() {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables (use your Neon pooled connection string)."
    );
  }
  _client = neon(url);
  return _client;
}

// Tagged-template proxy: usage stays `sql`...`` exactly as before.
export function sql(strings, ...values) {
  return client()(strings, ...values);
}
