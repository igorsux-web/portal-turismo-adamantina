import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function healthHandler(_req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ status: "unavailable" });
    await db.execute(sql`SELECT 1`);
    return res.status(200).json({ status: "ok" });
  } catch {
    return res.status(503).json({ status: "unavailable" });
  }
}
