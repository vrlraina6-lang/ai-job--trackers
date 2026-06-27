import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Job, JobInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "jobs.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.exec(`
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

  db = database;
  seedIfEmpty(database);
  return database;
}

function seedIfEmpty(database: Database.Database): void {
  const row = database.prepare("SELECT COUNT(*) AS count FROM jobs").get() as {
    count: number;
  };
  if (row.count > 0) return;

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

  for (const sample of samples) createJob(sample, database);
}

export function listJobs(): Job[] {
  return getDb()
    .prepare("SELECT * FROM jobs ORDER BY datetime(createdAt) DESC")
    .all() as Job[];
}

export function getJob(id: string): Job | undefined {
  return getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as
    | Job
    | undefined;
}

export function createJob(
  input: JobInput,
  database: Database.Database = getDb(),
): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  database
    .prepare(
      `INSERT INTO jobs
        (id, company, position, status, location, salary, url, notes, appliedDate, createdAt, updatedAt)
       VALUES
        (@id, @company, @position, @status, @location, @salary, @url, @notes, @appliedDate, @createdAt, @updatedAt)`,
    )
    .run(job);

  return job;
}

export function updateJob(id: string, input: JobInput): Job | undefined {
  const existing = getJob(id);
  if (!existing) return undefined;

  const updated: Job = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `UPDATE jobs SET
        company = @company,
        position = @position,
        status = @status,
        location = @location,
        salary = @salary,
        url = @url,
        notes = @notes,
        appliedDate = @appliedDate,
        updatedAt = @updatedAt
       WHERE id = @id`,
    )
    .run(updated);

  return updated;
}

export function deleteJob(id: string): boolean {
  const result = getDb().prepare("DELETE FROM jobs WHERE id = ?").run(id);
  return result.changes > 0;
}
