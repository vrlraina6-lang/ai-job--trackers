import { isJobStatus, type JobInput } from "./types";

export type ParseResult =
  | { ok: true; data: JobInput }
  | { ok: false; error: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseJobInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const raw = body as Record<string, unknown>;

  const company = asString(raw.company);
  const position = asString(raw.position);
  if (!company) return { ok: false, error: "Company is required." };
  if (!position) return { ok: false, error: "Position is required." };

  const status = raw.status;
  if (!isJobStatus(status)) {
    return { ok: false, error: "Invalid or missing status." };
  }

  const appliedDateRaw = asString(raw.appliedDate);

  return {
    ok: true,
    data: {
      company,
      position,
      status,
      location: asString(raw.location),
      salary: asString(raw.salary),
      url: asString(raw.url),
      notes: asString(raw.notes),
      appliedDate: appliedDateRaw || null,
    },
  };
}
