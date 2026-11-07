# Kimu self-hosting progress

## Scope and baseline

- User authorized a Kimu fork and initial work, with minimal setup for phone and
  laptop, natural-looking edits, and a CPU-only server.
- Fork: https://github.com/Movement-Create/videoeditor
- Upstream: https://github.com/trykimu/videoeditor
- Baseline: main at `6a30d43c5d2c381940478d89e4c712f40fd85146`.
- Task worktree: `/home/cosmos/wt/github/Movement-Create/videoeditor/selfhost-lite`.
- The glossary `viedo` worktree and its voice helper were not changed.

## Initial changes

- Separate PostgreSQL/Redis infrastructure configuration: project-scoped named
  volumes, localhost ports, explicit password, memory/CPU limits, correct PG18
  volume parent, migrations on first initialization.
- Configurable S3-compatible endpoint/region/path-style/credentials/buckets,
  retaining the default R2 deployment configuration. Fail early on incomplete
  settings without printing values. No provider has been configured.
- Configuration-only tests and README instructions explaining remaining setup.

## Verification

- Fork parent and local upstream baseline verified through GitHub/Git.
- `node --experimental-strip-types --test tests/*.test.mjs`: 9/9 passed
  (approximately 0.33 seconds). A first-run empty-S3-endpoint regression was
  caught by the tests and fixed before the passing run.
- Covers legacy R2, independent S3 settings, no credential mixing, empty optional
  endpoint, missing fields, safe endpoint validation, path-style validation,
  Compose isolation/volumes/resource limits and mandatory database password.
- Docker Compose configuration parsed successfully without starting containers.
- `git diff --check` passed. Full typecheck/lint/build not run: dependencies are
  not installed, and no global TypeScript/Prettier executable is available.

## Blockers and next steps

- 2026-11-07 preflight: approximately 3.6 GiB available RAM, no swap, 11 GiB
  available disk (97% used). No full dependency installation, container build,
  services or Chromium download attempted. Reassess headroom before those steps.
- Google OAuth, storage, protected HTTPS access and optional Gemini key remain
  unconfigured. No paid services, secrets or accounts were provisioned.
- Need actual provider integration, database migrations, application build,
  phone/laptop usability and real-media CPU export tests. Unit/config tests do
  not establish runtime viability or acceptable video quality.
- Keep PostgreSQL/Redis initially; replacing persistence is a larger rewrite.
- No commits or code pushes. GitHub fork exists; local changes are not published.
