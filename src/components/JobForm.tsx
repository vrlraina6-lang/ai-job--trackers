"use client";

import { useState } from "react";
import { JOB_STATUSES, type Job, type JobInput } from "@/lib/types";

interface JobFormProps {
  initialJob?: Job | null;
  onSubmit: (input: JobInput) => Promise<void>;
  onClose: () => void;
}

function formFromJob(job?: Job | null): JobInput {
  if (job) {
    return {
      company: job.company,
      position: job.position,
      status: job.status,
      location: job.location,
      salary: job.salary,
      url: job.url,
      notes: job.notes,
      appliedDate: job.appliedDate,
    };
  }
  return {
    company: "",
    position: "",
    status: "Wishlist",
    location: "",
    salary: "",
    url: "",
    notes: "",
    appliedDate: null,
  };
}

export default function JobForm({
  initialJob,
  onSubmit,
  onClose,
}: JobFormProps) {
  const [form, setForm] = useState<JobInput>(() => formFromJob(initialJob));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and position are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {initialJob ? "Edit application" : "Add application"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="company">
                Company *
              </label>
              <input
                id="company"
                className={inputClass}
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="position">
                Position *
              </label>
              <input
                id="position"
                className={inputClass}
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                placeholder="Frontend Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as JobInput["status"])
                }
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="appliedDate">
                Applied date
              </label>
              <input
                id="appliedDate"
                type="date"
                className={inputClass}
                value={form.appliedDate ?? ""}
                onChange={(e) => update("appliedDate", e.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className={inputClass}
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Remote"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="salary">
                Salary
              </label>
              <input
                id="salary"
                className={inputClass}
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
                placeholder="$120k–$140k"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="url">
              Job posting URL
            </label>
            <input
              id="url"
              className={inputClass}
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Recruiter contact, next steps, etc."
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : initialJob ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
