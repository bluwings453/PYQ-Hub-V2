# PYQ Hub

A previous-year-question-paper archive for BTech students — browse by institute, branch,
semester and exam type; view or download instantly; contribute a paper in a couple of
minutes as either a PDF or photos of each page.

## Folder structure — read this before pushing anywhere

```
pyq-hub/              <- open THIS folder in VS Code, and this is what you push to GitHub
  backend/             <- Express API + MongoDB
  frontend/             <- React (Vite) + Tailwind
  README.md
  .gitignore
```

**This whole `pyq-hub` folder is one Git repository.** Both `backend/` and `frontend/`
are subfolders inside it, not separate projects. If you open just the `backend` folder
on its own in VS Code and push from there, GitHub ends up with `server.js` sitting at
the repo's root with no `backend` folder around it — which is exactly what happened
last time, and is why Render couldn't find it. Always open the outer `pyq-hub` folder.

## Running it locally

**Prerequisites:** Node.js 18+, your MongoDB Atlas connection string, and a free
Cloudinary account (cloudinary.com — no card needed for the free tier).

```bash
# Terminal 1
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, ADMIN_PASSWORD, CLOUDINARY_*
npm install
npm run dev                # http://localhost:5000

# Terminal 2
cd frontend
cp .env.example .env       # VITE_API_BASE defaults to http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173`. Moderator sign-in is at `/admin`, using the
`ADMIN_PASSWORD` you set in `backend/.env`.

## How it works

- **Paper records** live in MongoDB (`backend/models/Paper.js`) — institute, branch,
  semester, exam type, subject, year, uploader info, and a `status` of `pending` /
  `approved` / `rejected`.
- **A paper is either one PDF, or one-or-more photos** of the pages, in the order they
  were added (`fileType: "pdf" | "images"`, `files: [...]` on the Paper document). PDFs
  get a plain "View" (new tab) + "Download" button; photo-based papers get a "View
  pages" button that opens an in-page viewer showing every page, each downloadable on
  its own.
- **Files are stored in Cloudinary**, not on the server's own disk and not inside
  MongoDB — `backend/config/cloudinary.js` uploads each file straight from memory to
  Cloudinary on submit (PDFs as `resource_type: "raw"`, photos as `"image"`), and the
  Paper record just stores each file's resulting URL, Cloudinary id, and resource type.
  This matters because a server's own local disk (Render, Railway, etc., on free
  tiers) is wiped on every redeploy or restart — Cloudinary storage is what makes
  uploads durable. Free tier: 25 credits/month (1 credit = 1GB storage, bandwidth, or
  1,000 transformations) — comfortably thousands of papers before that's a concern.
- **Institutes/branches/exam types** are a static list in `backend/utils/catalog.js` —
  not a database table, so you can add or rename an institute by editing one file. It's
  seeded with all IITs, NITs and IIITs plus every institute in NIRF's 2025 Engineering
  ranking (top 200) — ~214 real institutions, listed by plain original name (no
  abbreviation list to maintain). There's no single authoritative "top 1000"
  engineering-college list to pull from responsibly, so treat this as a strong starting
  point, not a finished one.
- **Institute selection is a search box, not a dropdown** (`InstituteSearch.jsx`) —
  matches anywhere in the name (so "bombay" finds "IIT Bombay"), grouped by
  IIT/NIT/IIIT/Other as you type, with an animated placeholder cycling through a few
  example names.
- **Every new paper is `pending` until a moderator approves it** at `/admin`. The admin
  queue previews every page directly from its Cloudinary URL before you decide.
- **Dark mode** is a toggle in the navbar (🌙/☀️), persisted to `localStorage`,
  defaulting to the visitor's system preference.

## Deploying

- **Database:** MongoDB Atlas (the same connection string as local dev)
- **Backend (Render):** create the web service from this repo, and set **Root
  Directory to `backend`** in its settings — this is the single most common setup
  mistake with this project's folder layout. Build Command: `npm install`. Start
  Command: `npm start`. Set the same env vars as `backend/.env.example`, with
  `CLIENT_ORIGIN` set to your deployed frontend's exact URL (no trailing slash).
- **Frontend (Netlify):** set the base directory to `frontend`, build command
  `npm run build`, publish directory `frontend/dist`. Set `VITE_API_BASE` to your
  Render URL + `/api`.
- **Free-tier cold starts:** Render's free web services sleep after inactivity: the
  first request after a quiet spell can take 20-50+ seconds. A free scheduled ping
  (e.g. a GitHub Actions workflow hitting `/api/health` every 10 minutes) keeps it warm
  if that's a problem for you.

## Getting real papers in (the actual hard part)

The code is the easy 20%. The archive is only useful once it has papers in it, and
you're not a student anymore, so:

1. **Start with one college, not thirty.** Pick the one where you have the strongest
   network and get that one to critical mass first.
2. **Recruit a "campus rep"** — one student per college with access to a class
   WhatsApp/Telegram group where papers already float around.
3. **SEO is your real growth channel.** Searches like "NIT Trichy DSA mid sem previous
   papers" happen constantly and have strong intent — each subject/institute
   combination should be a crawlable page, not something hidden behind a search box.
