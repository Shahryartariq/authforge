# Contributing

Thanks for helping. Bug reports, fixes and small improvements are all welcome.

Found a security problem? Don't open an issue. See [SECURITY.md](SECURITY.md).

## Set up

You need Node 22 (see `.nvmrc`), pnpm and a Postgres database.

```bash
pnpm install
cp .env.example .env    # then set DATABASE_URL and BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:migrate
pnpm dev
```

Don't run `pnpm env:setup` in a checkout you'll contribute from: it deletes the files of the ORM you didn't pick, and the repository keeps both.

## Before you open a pull request

```bash
pnpm lint && pnpm typecheck && pnpm test   # seconds
pnpm test:e2e                              # a few minutes; builds the app twice
```

CI runs the same checks, with Drizzle and with Prisma.

- **Work on a branch** and open a pull request against `main`.
- **Add a test** for anything a user would notice. Browser tests live in `tests/e2e` and sign up their own users, so they can run in any order.
- **Keep both ORMs working.** App queries live in `src/db/queries.ts` (Drizzle) and `orm/prisma/src/db/queries.ts` (Prisma) with the same exports. Change both.
- **Changed `src/lib/auth.ts` in a way that touches the database?** Run `pnpm auth:schema`, then `pnpm db:generate`, and commit the migration. CI fails if they drift.
- **Write for the next reader.** Comments say why, in plain words. User-facing text tells people what to do next.
- Add a line to `CHANGELOG.md` when the change is visible to people using the starter.

## Reporting a bug

Use the bug report form. The steps to reproduce matter most. Leave out secrets, tokens and real email addresses.
