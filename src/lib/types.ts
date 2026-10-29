export const JOB_STATUSES = [
  "Wishlist",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  location: string;
  salary: string;
  url: string;
  notes: string;
  appliedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type JobInput = Omit<Job, "id" | "createdAt" | "updatedAt">;

export function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (JOB_STATUSES as readonly string[]).includes(value)
  );
}
