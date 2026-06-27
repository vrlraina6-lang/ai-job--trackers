import { NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/db";
import { parseJobInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseJobInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const job = await createJob(parsed.data);
  return NextResponse.json(job, { status: 201 });
}
