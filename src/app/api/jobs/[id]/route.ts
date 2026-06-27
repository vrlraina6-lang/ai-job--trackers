import { NextResponse } from "next/server";
import { deleteJob, getJob, updateJob } from "@/lib/db";
import { parseJobInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  return NextResponse.json(job);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

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

  const job = updateJob(id, parsed.data);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  return NextResponse.json(job);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const deleted = deleteJob(id);
  if (!deleted) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
