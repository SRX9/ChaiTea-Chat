import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SUPABASE_POSTGRES_DB_URL as string,
});

// Ensure we use the correct schema if you set one.
pool.on("connect", (client) => {
  client.query("SET search_path = chaitea, public");
});

export default pool;
