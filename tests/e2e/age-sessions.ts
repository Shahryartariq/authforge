/**
 * Test helper: makes a user's sessions look N days old, as if they had stayed
 * signed in. (Some actions only work for a day after signing in.)
 *
 *   tsx tests/e2e/age-sessions.ts someone@example.com 2
 *
 * It goes through the app's own database client, so it works with Drizzle and
 * with Prisma without importing either.
 */
import { db } from "../../src/db";

const [email = "", days = ""] = process.argv.slice(2);
// Both values end up in SQL text, so only the shapes the tests use are accepted.
if (!/^[a-z0-9._+-]+@example\.com$/.test(email) || !/^\d{1,3}$/.test(days)) {
  console.error("Usage: tsx tests/e2e/age-sessions.ts <name@example.com> <days>");
  process.exit(1);
}

const client = db as unknown as {
  $executeRawUnsafe?: (query: string) => Promise<unknown>; // Prisma
  execute?: (query: string) => Promise<unknown>; // Drizzle
};
const run = (query: string) =>
  client.$executeRawUnsafe ? client.$executeRawUnsafe(query) : client.execute!(query);

const update = (createdAt: string, userId: string) =>
  run(
    `update "session" set ${createdAt} = now() - interval '${days} days'
     where ${userId} = (select id from "user" where email = '${email}')`,
  );

// Drizzle names the columns created_at / user_id; Prisma keeps createdAt / userId.
update("created_at", "user_id")
  .catch(() => update('"createdAt"', '"userId"'))
  .then(
    () => process.exit(0),
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    },
  );
