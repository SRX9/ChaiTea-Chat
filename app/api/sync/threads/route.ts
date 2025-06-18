import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";
import { isServerLoggedIn } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const { user, isLoggedIn } = await isServerLoggedIn();
  if (!isLoggedIn || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const threadId = req.nextUrl.searchParams.get("threadId");

  const params: any[] = [user.id];
  let sql = `SELECT * FROM threads WHERE user_id = $1`;

  if (threadId) {
    params.push(threadId);
    sql += ` AND id = $${params.length}`;
  }

  if (since) {
    params.push(new Date(since));
    sql += ` AND updated_at > $${params.length}`;
  }

  try {
    const { rows } = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[threads] GET error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, isLoggedIn } = await isServerLoggedIn();
  if (!isLoggedIn || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { records?: any[] } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const records = payload.records || [];
  if (!Array.isArray(records)) {
    return NextResponse.json(
      { error: "records must be array" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const r of records) {
      if (r.user_id && r.user_id !== user.id) continue; // ignore forged user id
      const {
        id,
        title,
        pinned,
        mode,
        createdAt,
        updatedAt,
        syncedAt,
        version,
      } = mapThreadColumns(r, user.id);

      await client.query(
        `INSERT INTO threads (id, user_id, title, pinned, mode, created_at, updated_at, synced_at, version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           pinned = EXCLUDED.pinned,
           mode = EXCLUDED.mode,
           updated_at = EXCLUDED.updated_at,
           synced_at = EXCLUDED.synced_at,
           version = EXCLUDED.version`,
        [
          id,
          user.id,
          title,
          pinned,
          mode,
          createdAt,
          updatedAt,
          syncedAt,
          version,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[threads] POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

function mapThreadColumns(record: any, userId: string) {
  return {
    id: record.id,
    title: record.title ?? "Untitled",
    pinned: record.pinned ?? false,
    mode: record.mode ?? null,
    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
    syncedAt: record.syncedAt ? new Date(record.syncedAt) : new Date(),
    version: record.version ?? 1,
    user_id: userId,
  };
}
