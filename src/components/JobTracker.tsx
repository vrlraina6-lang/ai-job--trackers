"use client";

import { useEffect, useMemo, useState } from "react";
import { JOB_STATUSES, type Job, type JobInput, type JobStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/statusMeta";
import JobForm from "./JobForm";
import StatusBadge from "./StatusBadge";

type Filter = JobStatus | "All";

async function fetchJobs(): Promise<Job[]> {
  const res = await fetch("/api/jobs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load applications.");
  return res.json();
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === "string" ? data.error : "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export default function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load."),
      )
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const base = Object.fromEntries(
      JOB_STATUSES.map((s) => [s, 0]),
    ) as Record<JobStatus, number>;
    for (const job of jobs) base[job.status] += 1;
    return base;
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter !== "All" && job.status !== filter) return false;
      if (!term) return true;
      return (
        job.company.toLowerCase().includes(term) ||
        job.position.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)
      );
    });
  }, [jobs, filter, search]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(job: Job) {
    setEditing(job);
    setFormOpen(true);
  }

  async function handleSubmit(input: JobInput) {
    const res = await fetch(
      editing ? `/api/jobs/${editing.id}` : "/api/jobs",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) throw new Error(await parseError(res));
    const saved: Job = await res.json();
    setJobs((prev) =>
      editing
        ? prev.map((j) => (j.id === saved.id ? saved : j))
        : [saved, ...prev],
    );
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete(job: Job) {
    if (
      !window.confirm(
        `Delete the ${job.position} application at ${job.company}?`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      window.alert(await parseError(res));
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Job Tracker</h1>
          <p className="text-sm text-slate-500">
            Keep every application organized in one place.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Add application
        </button>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={jobs.length}
          active={filter === "All"}
          onClick={() => setFilter("All")}
          accent="text-indigo-600"
        />
        {JOB_STATUSES.map((status) => (
          <StatCard
            key={status}
            label={status}
            value={counts[status]}
            active={filter === status}
            onClick={() => setFilter(status)}
            accent={STATUS_META[status].accent}
          />
        ))}
      </section>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, position, or location…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-sm"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading applications…</p>
      ) : loadError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </p>
      ) : visibleJobs.length === 0 ? (
        <EmptyState hasJobs={jobs.length > 0} onAdd={openAdd} />
      ) : (
        <ul className="space-y-3">
          {visibleJobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onEdit={() => openEdit(job)}
              onDelete={() => handleDelete(job)}
            />
          ))}
        </ul>
      )}

      {formOpen && (
        <JobForm
          key={editing?.id ?? "new"}
          initialJob={editing}
          onSubmit={handleSubmit}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  active,
  onClick,
  accent,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border bg-white p-3 text-left transition ${
        active
          ? "border-indigo-500 ring-2 ring-indigo-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="truncate text-xs font-medium text-slate-500">{label}</div>
    </button>
  );
}

function JobRow({
  job,
  onEdit,
  onDelete,
}: {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{job.position}</h3>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-slate-600">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {job.salary && <span>{job.salary}</span>}
            {job.appliedDate && <span>Applied {job.appliedDate}</span>}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                View posting ↗
              </a>
            )}
          </div>
          {job.notes && (
            <p className="mt-2 text-sm text-slate-600">{job.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyState({
  hasJobs,
  onAdd,
}: {
  hasJobs: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-slate-600">
        {hasJobs
          ? "No applications match this filter."
          : "No applications yet."}
      </p>
      {!hasJobs && (
        <button
          onClick={onAdd}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add your first application
        </button>
      )}
    </div>
  );
}
