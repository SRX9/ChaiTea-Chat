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
  let sql = `SELECT * FROM messages WHERE user_id = $1`;

  if (threadId) {
    params.push(threadId);
    sql += ` AND thread_id = $${params.length}`;
  }

  if (since) {
    params.push(new Date(since));
    sql += ` AND updated_at > $${params.length}`;
  }

  try {
    const { rows } = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[messages] GET error", err);
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
      if (r.user_id && r.user_id !== user.id) continue;

      const {
        id,
        thread_id,
        role,
        content,
        created_at,
        updated_at,
        synced_at,
        version,
        deleted,
        model_id,
        token_usage,
        attachments,
      } = mapMessageColumns(r, user.id);

      // Ensure the parent thread exists. This is a no-op when the thread is
      // already present, but prevents foreign-key violations when a client
      // happens to push a message before its thread has been synced.
      if (thread_id) {
        await client.query(
          `INSERT INTO threads (id, user_id, title, created_at, updated_at, synced_at, version)
           VALUES ($1, $2, $3, $4, $5, $6, 1)
           ON CONFLICT (id) DO NOTHING`,
          [
            thread_id,
            user.id,
            r.threadTitle ?? r.title ?? "Untitled",
            created_at,
            updated_at,
            synced_at,
          ]
        );
      }

      await client.query(
        `INSERT INTO messages (
          id, thread_id, user_id, role, content, created_at, updated_at, synced_at, version, deleted, model_id, token_usage, attachments
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        ) ON CONFLICT (id) DO UPDATE SET
          thread_id = EXCLUDED.thread_id,
          role = EXCLUDED.role,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at,
          synced_at = EXCLUDED.synced_at,
          version = EXCLUDED.version,
          deleted = EXCLUDED.deleted,
          model_id = EXCLUDED.model_id,
          token_usage = EXCLUDED.token_usage,
          attachments = EXCLUDED.attachments`,
        [
          id,
          thread_id,
          user.id,
          role,
          content,
          created_at,
          updated_at,
          synced_at,
          version,
          deleted,
          model_id,
          token_usage,
          attachments,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[messages] POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

function mapMessageColumns(record: any, userId: string) {
  return {
    id: record.id,
    thread_id: record.threadId ?? record.thread_id,
    role: record.role,
    content: record.content,
    created_at: record.createdAt ? new Date(record.createdAt) : new Date(),
    updated_at: record.updatedAt ? new Date(record.updatedAt) : new Date(),
    synced_at: record.syncedAt ? new Date(record.syncedAt) : new Date(),
    version: record.version ?? 1,
    deleted: record.deleted ?? false,
    model_id: record.modelId ?? record.model_id ?? null,
    token_usage: record.tokenUsage ?? record.token_usage ?? null,
    attachments: record.attachments ? JSON.stringify(record.attachments) : null,
    user_id: userId,
  };
}
