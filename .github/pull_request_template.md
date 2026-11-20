## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## How it was tested

- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] `pnpm test:e2e` (or the part that covers this change)
- [ ] Tried it in the browser

## Checklist

- [ ] Changes to `src/lib/auth.ts` that affect the database: ran `pnpm auth:schema` and added a migration
- [ ] Works with both ORMs (the same query in `src/db/queries.ts` and `orm/prisma/src/db/queries.ts`)
- [ ] New behaviour has a test; `CHANGELOG.md` and the README are updated if users will notice it
