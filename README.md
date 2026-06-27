# AI Job Tracker

A simple web app to track your job applications — add, edit, and delete
applications, organize them by status, search them, and see a live dashboard of
where everything stands.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, with
**SQLite** (`better-sqlite3`) for persistence.

## Features

- **Dashboard** — counts per status (Wishlist, Applied, Interviewing, Offer,
  Rejected) plus a total. Click a card to filter.
- **CRUD** — add, edit, and delete applications via a modal form.
- **Search** — filter by company, position, or location.
- **Fields** — company, position, status, location, salary, posting URL, notes,
  and applied date.
- **Persistence** — data is stored in a local SQLite database at `data/jobs.db`
  (created automatically and seeded with a few sample rows on first run).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the dev server              |
| `npm run build` | Production build                  |
| `npm start`     | Run the production build          |
| `npm run lint`  | Lint with ESLint                  |

## API

REST endpoints used by the UI:

| Method   | Route            | Description              |
| -------- | ---------------- | ------------------------ |
| `GET`    | `/api/jobs`      | List all applications    |
| `POST`   | `/api/jobs`      | Create an application     |
| `GET`    | `/api/jobs/[id]` | Get one application      |
| `PUT`    | `/api/jobs/[id]` | Update an application     |
| `DELETE` | `/api/jobs/[id]` | Delete an application     |

## Project structure

```
src/
  app/
    api/jobs/route.ts          # list + create
    api/jobs/[id]/route.ts     # get + update + delete
    page.tsx                   # home page
  components/
    JobTracker.tsx             # main client UI (dashboard, list, filters)
    JobForm.tsx                # add/edit modal form
    StatusBadge.tsx            # status pill
  lib/
    db.ts                      # SQLite access + seed data
    types.ts                   # Job model + statuses
    validation.ts              # request body validation
```

## Notes

The SQLite database file lives in `data/` and is gitignored. Delete `data/` to
reset to the seed data.
