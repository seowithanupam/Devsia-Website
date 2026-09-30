// Runs the opt-in MongoDB repository tests (tests/db) against a THROWAWAY database.
//
//   npm run test:db               explains what would happen and exits. Nothing is run or written.
//   npm run test:db -- --confirm  runs the tests.
//
// It never touches the database named in your connection string. It creates a new database called devsia_test_<random>,
// runs the tests there, and drops it at the end. Your app's MONGODB_URI is removed from the environment the tests run in.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseMongoUri } from "./lib/mongo-uri.mjs";

const confirmed = process.argv.includes("--confirm");
const testUri = (process.env.MONGODB_TEST_URI ?? "").trim();
const appUri = (process.env.MONGODB_URI ?? "").trim();
const uri = testUri || appUri;
const source = testUri ? "MONGODB_TEST_URI" : "MONGODB_URI";

if (!uri) {
  console.error("No connection string found. Set MONGODB_TEST_URI (or MONGODB_URI) in .env.local, then run again.");
  process.exit(1);
}
const parsed = parseMongoUri(uri);
if (!parsed) {
  console.error(`${source} is not a MongoDB connection string.`);
  process.exit(1);
}

const dbName = `devsia_test_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
const own = parsed.database || "(none, so the driver would use \"test\")";

console.log("MongoDB repository tests");
console.log(`  connection used : ${source} (only the cluster and login are used; the value is never printed)`);
console.log(`  your database   : ${own}  <- NEVER touched`);
console.log(`  test database   : ${dbName}  <- created for this run, dropped at the end`);
console.log("  needs           : a database user allowed to create databases on this cluster (for example the Atlas role readWriteAnyDatabase).");
console.log("                    If your user is limited to one database, create another Atlas user and put its URI in MONGODB_TEST_URI.");

if (!confirmed) {
  console.log("\nNothing was run. To run the tests: npm run test:db -- --confirm");
  process.exit(0);
}

console.log("\nRunning...\n");
const env = { ...process.env, RUN_DB_TESTS: "1", DB_TEST_URI: uri, DB_TEST_DATABASE: dbName };
delete env.MONGODB_URI; // the tests never see the app's own connection string
delete env.MONGODB_TEST_URI;
const vitest = fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url));
const result = spawnSync(process.execPath, [vitest, "run", "tests/db"], { stdio: "inherit", env });
console.log(result.status === 0 ? "\nThe throwaway database was dropped. Your content database was not touched." : "\nSome tests failed. The throwaway database is dropped at the end of every run; if a run was interrupted, any database whose name starts with devsia_test_ can be deleted in Atlas.");
process.exit(result.status ?? 1);
