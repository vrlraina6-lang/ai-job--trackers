import { createClient, type Client, type Row } from "@libsql/client";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Job, JobInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "jobs.db");

let client: Client | null = null;
let ready: Promise<Client> | null = null;

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  return createClient({ url: `file:${DB_PATH}` });
}

async function getDb(): Promise<Client> {
  if (client) return client;
  if (!ready) {
    ready = (async () => {
      const db = createDbClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS jobs (
          id          TEXT PRIMARY KEY,
          company     TEXT NOT NULL,
          position    TEXT NOT NULL,
          status      TEXT NOT NULL,
          location    TEXT NOT NULL DEFAULT '',
          salary      TEXT NOT NULL DEFAULT '',
          url         TEXT NOT NULL DEFAULT '',
          notes       TEXT NOT NULL DEFAULT '',
          appliedDate TEXT,
          createdAt   TEXT NOT NULL,
          updatedAt   TEXT NOT NULL
        );
      `);
      await seedIfEmpty(db);
      client = db;
      return db;
    })();
  }
  return ready;
}

function rowToJob(row: Row): Job {
  return {
    id: row.id as string,
    company: row.company as string,
    position: row.position as string,
    status: row.status as Job["status"],
    location: row.location as string,
    salary: row.salary as string,
    url: row.url as string,
    notes: row.notes as string,
    appliedDate: (row.appliedDate as string | null) ?? null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

async function seedIfEmpty(db: Client): Promise<void> {
  const result = await db.execute("SELECT COUNT(*) AS count FROM jobs");
  const count = Number(result.rows[0]?.count ?? 0);
  if (count > 0) return;

  const samples: JobInput[] = [
    {
      company: "Acme Corp",
      position: "Frontend Engineer",
      status: "Applied",
      location: "Remote",
      salary: "$120k–$140k",
      url: "https://example.com/acme/frontend",
      notes: "Referred by a friend on the design team.",
      appliedDate: "2026-06-10",
    },
    {
      company: "Globex",
      position: "Full-Stack Developer",
      status: "Interviewing",
      location: "New York, NY",
      salary: "$130k–$155k",
      url: "https://example.com/globex/fullstack",
      notes: "Technical screen scheduled — review system design.",
      appliedDate: "2026-06-02",
    },
    {
      company: "Initech",
      position: "Software Engineer II",
      status: "Wishlist",
      location: "Austin, TX",
      salary: "",
      url: "https://example.com/initech/swe",
      notes: "Waiting for a referral before applying.",
      appliedDate: null,
    },
  ];

  for (const sample of samples) await insertJob(db, sample);
}

async function insertJob(db: Client, input: JobInput): Promise<Job> {
  const now = new Date().toISOString();
  const job: Job = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await db.execute({
    sql: `INSERT INTO jobs
        (id, company, position, status, location, salary, url, notes, appliedDate, createdAt, updatedAt)
       VALUES
        (:id, :company, :position, :status, :location, :salary, :url, :notes, :appliedDate, :createdAt, :updatedAt)`,
    args: { ...job },
  });

  return job;
}

export async function listJobs(): Promise<Job[]> {
  const db = await getDb();
  const result = await db.execute(
    "SELECT * FROM jobs ORDER BY datetime(createdAt) DESC",
  );
  return result.rows.map(rowToJob);
}

export async function getJob(id: string): Promise<Job | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM jobs WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToJob(row) : undefined;
}

export async function createJob(input: JobInput): Promise<Job> {
  const db = await getDb();
  return insertJob(db, input);
}

export async function updateJob(
  id: string,
  input: JobInput,
): Promise<Job | undefined> {
  const existing = await getJob(id);
  if (!existing) return undefined;

  const updated: Job = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const db = await getDb();
  await db.execute({
    sql: `UPDATE jobs SET
        company = :company,
        position = :position,
        status = :status,
        location = :location,
        salary = :salary,
        url = :url,
        notes = :notes,
        appliedDate = :appliedDate,
        updatedAt = :updatedAt
       WHERE id = :id`,
    args: {
      id: updated.id,
      company: updated.company,
      position: updated.position,
      status: updated.status,
      location: updated.location,
      salary: updated.salary,
      url: updated.url,
      notes: updated.notes,
      appliedDate: updated.appliedDate,
      updatedAt: updated.updatedAt,
    },
  });

  return updated;
}

export async function deleteJob(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute({
    sql: "DELETE FROM jobs WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}
