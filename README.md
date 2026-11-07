
<br />

<p align="center">
  <img width="3200" height="804" alt="image" src="https://github.com/user-attachments/assets/08149933-609a-4556-8ab4-4ef2622a9c8f" />

</p>
<p align="center">A friendly AI powered open-source alternative to Capcut, Canva.<br><samp>
<a href="https://discord.gg/24Mt5DGcbx"> Discord</a> &nbsp; <a href="https://x.com/trykimu"> Twitter</a> &nbsp; <a href="https://trykimu.com"> Website</a></p>
</samp>

## ✨Features

<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/c504e379-110d-4286-b2b7-7676aa186112" />
      <h2 align="center">Advanced Multi‑Track Editing</h2>
      <p align="center">Edit across unlimited tracks with precise control, snapping, and effortless layer management.</p>
      <br>
    </td>
    <td>
      <img width="1600" height="1000" alt="image" src="https://github.com/user-attachments/assets/94f05873-2f52-46ad-831a-55936f7999da" />
      <h2 align="center">Real‑Time Preview</h2>
      <p align="center">See every change instantly with low‑latency playback—no waiting, no rendering.</p>
      <br>
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/3f464355-d290-4586-aead-f9a1a3c58d63" />
      <h2 align="center">Fast Export</h2>
      <p align="center">Render high‑quality videos quickly and export exactly where you need them.</p>
      <br>
    </td>
    </tr>
    <tr>
      <td>
        <img src="https://github.com/user-attachments/assets/32920f51-4faf-442f-92fc-50d4809cd290" /><h2 align="center">Vibe AI Assistant</h2>
        <p align="center">Describe your idea and let Kimu generate edits, timing, and layouts automatically.</p>
        <br>
      </td>
    <td>
      <img src="https://github.com/user-attachments/assets/0527e006-8438-466e-83ef-b05d7f98604b" />
      <h2 align="center">Smart Media Library</h2>
      <p align="center">Organize by type, tags, and sentiment—search and filter your assets in seconds.</p>
      <br>
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/dae66fb2-3e53-46ce-8fe0-10e62ac3cf70" />
      <h2 align="center">Cloud‑Synced Projects</h2>
      <p align="center">Keep timelines and assets in sync across devices so you can pick up right where you left off.</p>
      <br>
    </td>
  </tr>
</table>
<p align="center">transitions, offline datastore, OAuth based security, change control
<br> and much more...</p>
</samp>

## 💻 Development

### This fork: single-server setup (in progress)

The initial self-hosting changes keep PostgreSQL (accounts/projects) and Redis
(render queue). Neither needs a managed database subscription. They are **not**
removed or replaced with SQLite. `compose.selfhost-infra.yml` packages just those
two services with persistent volumes, loopback-only ports, resource limits, and
no global container names. The editor, renderer and AI backend are not included
in that file yet. Do not mistake it for a complete deployment.

On this devbox, keep real secrets under `/home/cosmos/env`, never in this repo.
After creating an external configuration file containing a strong
`KIMU_POSTGRES_PASSWORD`, validate it without printing resolved secrets:

```bash
docker compose --env-file /home/cosmos/env/kimu.env -p kimu-personal -f compose.selfhost-infra.yml config --quiet
# Only after checking available memory, disk and ports:
docker compose --env-file /home/cosmos/env/kimu.env -p kimu-personal -f compose.selfhost-infra.yml up -d --wait
```

The services default to `127.0.0.1:15432` (PostgreSQL) and `127.0.0.1:16379`
(Redis). Override `KIMU_POSTGRES_PORT` / `KIMU_REDIS_PORT` if occupied. Configure
the app's `DATABASE_URL` with the matching credentials/port and `REDIS_URL` with
the matching Redis port. The Compose env file is **not** automatically loaded by
host-run Node/Python processes: supply the external variables through your
process manager. No new real secret file has been created by this change.

Migrations run only on the first initialization of an empty database. Existing
databases need an explicit migration plan. Keep the same Compose project name
to reuse its volumes. `down` preserves volumes; **do not use `down -v`**, which
deletes data. Backups of the database and media are required before real use.

Storage now supports either the existing `R2_*` variables or an explicit
`S3_ENDPOINT` plus the `S3_*` settings in `.env.example`. Setting an S3 endpoint
selects only S3 credentials/buckets; it never silently borrows R2 credentials.
This allows an S3-compatible store, but does not install one, create buckets or
provide a local-filesystem storage mode. Create private assets/renders buckets
and scope the credentials to them. Use HTTPS for remote access. Signed render
URLs use that endpoint, so it must resolve and be reachable from both the
renderer and your phone/laptop; a container-only hostname or server localhost
will not work remotely. Never make buckets public to bypass URL/access issues.

Remaining before a usable single-server deployment:

- Choose/configure storage and test upload, seek/range requests, copy, delete and
  signed playback/download with the selected provider.
- Configure Google OAuth (still required by the current login screen). A secure
  alternative sign-in flow is future work, not an authentication bypass.
- Configure a consistent origin and protected HTTPS access for phone/laptop.
- Install dependencies and Chromium, build, then test migrations, login, a real
  phone clip, project reload and CPU export. Review upstream production settings
  before use: they reference the upstream domain and standard public ports.
- Enable AI editing only with an explicitly configured model key; model API
  usage can cost money. Manual editing still needs the other app services.

Configuration tests need Node 22.23+ and Docker Compose v2, but no package
install, running Docker daemon, downloads, real credentials or paid calls:

```bash
node --experimental-strip-types --test tests/*.test.mjs
```

These tests validate configuration only, not a working editor or S3 provider.

<strong> 🛠️ <ins>Local Development</ins></strong>

PostgreSQL and Redis run in Docker. All three application services run directly on your machine — Vite handles proxying so no nginx is needed.

```bash
# Install dependencies
pnpm i
cd backend && uv sync && cd ..

# 1. Start PostgreSQL and Redis (upstream dev configuration)
docker compose -f docker-compose.dev.yml up -d

# 2. Start FastAPI  (terminal 1)
cd backend && uv run uvicorn main:app --reload --port 3000

# 3. Start renderer  (terminal 2)
pnpm dlx tsx app/videorender/videorender.ts

# 4. Start frontend  (terminal 3)
pnpm dev
```

Open **`http://localhost:5173`**. The Vite dev server proxies requests transparently:

<samp>

- `/backend/*` → FastAPI at `:3000`
- `/renderer/*` → Renderer at `:8000`
- `/*` → React Router SSR (Vite)

</samp>

`Requirements`

<samp>
  
- Node.js 20+
- Python 3.12+
- pnpm
- Docker (for PostgreSQL and Redis)

</samp>

## 🚀 Production

Everything runs in Docker behind nginx. One command:

```bash
docker compose up -d
```

**With Custom Domain:**

```bash
PROD_DOMAIN=yourdomain.com docker compose up -d
```

nginx routes:

<samp>

- `/backend/*` → FastAPI
- `/renderer/*` → Renderer (video rendering)
- `/*` → Frontend (React Router SSR)

</samp>

**Ports:**

- HTTP: `80` (redirects to HTTPS)
- HTTPS: `443`

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
# Local/Docker Postgres (dev or self-hosted prod):
DATABASE_URL=postgresql://videoeditor:videoeditor@localhost:5432/videoeditor

# — OR — Supabase Session Pooler (cloud):
DATABASE_URL=postgresql://postgres.REF:password@aws-0-REGION.pooler.supabase.com:5432/postgres
DATABASE_SSL=true   # required for Supabase; omit for local/Docker Postgres

# BetterAuth
BETTER_AUTH_SECRET=   # generate with: openssl rand -hex 32
BETTER_AUTH_URL=https://yourdomain.com   # http://localhost:5173 for dev

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Features (optional)
GEMINI_API_KEY=your_gemini_api_key
```

**Environment Variables Explained:**

- `DATABASE_URL`: PostgreSQL connection string. Use the local Docker URL for dev/self-hosted prod, or the Supabase Session Pooler URL for cloud.
- `DATABASE_SSL`: Set to `"true"` when connecting to Supabase or any remote DB that requires SSL. Leave unset for local/Docker Postgres.
- `BETTER_AUTH_SECRET`: Random secret used to sign sessions — generate with `openssl rand -hex 32`.
- `BETTER_AUTH_URL`: The public URL of the app. Used by BetterAuth for OAuth callbacks.
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth credentials — register at [console.cloud.google.com](https://console.cloud.google.com).
- `GEMINI_API_KEY`: Required for AI-powered video editing features.

<br>

## 📃TODO

<samp> We have a lot of work! For starters, we plan to integrate all Remotion APIs. I'll add a proper roadmap soon. Join the [Discord Server](https://discord.com/invite/GSknuxubZK) for updates and support. </samp>

## ❤️Contribution

<samp> We would love your contributions! ❤️ Check the [contribution guide](CONTRIBUTING.md). </samp>

## 📜License

<samp> This project is licensed under a dual-license. Refer to [LICENSE](LICENSE.md) for details. The [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) also applies to the relevant parts of the project. </samp>
