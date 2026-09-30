// TEMPORARY DIAGNOSTIC. Not imported by the app; delete this file, scripts/lib and the "db:check" npm script
// once the database connects. It never prints the connection string or any password.
//
// Run:  npm run db:check
//
// Checks, in order: your environment, the shape of MONGODB_URI (SRV or standard), DNS as Node itself sees it
// (the resolver the MongoDB driver uses), whether port 27017 is reachable, the driver connection, and the
// users collection. If SRV lookups fail on this machine it also prints the equivalent standard connection
// string, built from the cluster's own DNS answers, with <username>:<password> left for you to fill in.

import dns from "node:dns";
import net from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { buildStandardTemplate, parseMongoUri } from "./lib/mongo-uri.mjs";
import { EXPECTED_INDEXES } from "../lib/db/expected-indexes.mjs";

const raw = (process.env.MONGODB_URI ?? "").trim();
let failures = 0;
const line = (s = "") => console.log(s);
const ok = (s) => console.log(`  ✔ ${s}`);
const info = (s) => console.log(`    ${s}`);
const bad = (s) => {
  failures += 1;
  console.log(`  ✘ ${s}`);
};
const step = (n, title) => {
  line();
  console.log(`[${n}] ${title}`);
};

// ---- redaction: nothing secret may reach the screen ---------------------------------------------
const secrets = new Set();
function addSecret(value) {
  if (typeof value === "string" && value.length >= 3) {
    secrets.add(value);
    try {
      secrets.add(decodeURIComponent(value));
    } catch {
      /* not percent-encoded */
    }
    secrets.add(encodeURIComponent(value));
  }
}
function redact(text) {
  let out = String(text ?? "");
  if (raw) out = out.split(raw).join("<MONGODB_URI>");
  for (const s of secrets) out = out.split(s).join("***");
  return out.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]*@/gi, "$1***:***@");
}
function describeError(error) {
  const e = error ?? {};
  const parts = [`${e.name ?? "Error"}${e.code !== undefined ? ` (code ${e.code})` : ""}${e.codeName ? ` ${e.codeName}` : ""}`];
  parts.push(redact(e.message));
  if (e.syscall || e.hostname) parts.push(`syscall=${e.syscall ?? "-"} hostname=${e.hostname ?? "-"}`);
  return parts.join(" | ");
}

/** Can this machine open a TCP connection to host:port? Uses the system resolver, like the driver does for standard strings. */
function probe(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done({ ok: false, reason: `no answer within ${timeoutMs / 1000}s (blocked or filtered?)` }));
    socket.once("connect", () => done({ ok: true }));
    socket.once("error", (e) => done({ ok: false, reason: `${e.code ?? e.name}: ${redact(e.message)}` }));
  });
}
async function probeAll(hosts) {
  for (const h of hosts) {
    const port = h.port ?? 27017;
    const result = await probe(h.name, port);
    if (result.ok) ok(`TCP ${h.name}:${port} reachable (system resolver + network)`);
    else bad(`TCP ${h.name}:${port} NOT reachable: ${result.reason}`);
  }
}

// ---- 0. environment ------------------------------------------------------------------------------
step(0, "Environment");
info(`Node ${process.version} on ${process.platform} ${process.arch}`);
info(`DNS servers Node will use: ${dns.getServers().join(", ") || "(none)"}`);
for (const name of ["NODE_OPTIONS", "HTTPS_PROXY", "HTTP_PROXY", "NODE_TLS_REJECT_UNAUTHORIZED"]) {
  if (process.env[name]) info(`${name} is set (${name === "NODE_OPTIONS" ? redact(process.env[name]) : "value hidden"})`);
}
const version = (pkg) => {
  try {
    return JSON.parse(readFileSync(new URL(`../node_modules/${pkg}/package.json`, import.meta.url), "utf8")).version;
  } catch {
    return "not found";
  }
};
info(`mongoose ${version("mongoose")}, MongoDB Node.js driver ${version("mongodb")}`);
if (!existsSync(new URL("../.env.local", import.meta.url))) info("note: .env.local was not found next to package.json (variables may come from .env or the shell)");

// ---- 1. the URI ----------------------------------------------------------------------------------
step(1, "MONGODB_URI (shape only; the value is never printed)");
if (!raw) {
  bad("MONGODB_URI is empty or not set in the environment this script sees.");
  info("Put it in .env.local as MONGODB_URI=... (no spaces around =) and run again.");
  process.exit(1);
}
const parsed = parseMongoUri(raw);
if (!parsed) {
  bad("MONGODB_URI does not start with mongodb:// or mongodb+srv://. Check for a stray space, quote or line break.");
  process.exit(1);
}
addSecret(parsed.password);
addSecret(parsed.username);
const isSrv = parsed.scheme === "mongodb+srv";
ok(`${isSrv ? "SRV string (mongodb+srv://)" : "standard string (mongodb://)"}, ${parsed.hosts.length} host${parsed.hosts.length === 1 ? "" : "s"}: ${parsed.hosts.map((h) => h.name + (h.port ? `:${h.port}` : "")).join(", ")}`);
info(`credentials present: user ${parsed.username ? "yes" : "NO"}, password ${parsed.password ? "yes" : "NO"}`);
if (parsed.rawAtSigns > 0) bad(`the password contains ${parsed.rawAtSigns} raw "@" character(s). Each must be written %40.`);
if (/[<>]/.test(raw)) bad('the string still contains "<" or ">". Replace the whole <db_password> placeholder, brackets included.');
if (/^["']|["']$/.test(process.env.MONGODB_URI ?? "")) bad("the value is wrapped in quotes that were not stripped.");
if (isSrv && parsed.hosts.length !== 1) bad("an SRV string must name exactly one host.");
if (isSrv && parsed.hosts[0]?.port) bad("an SRV string must not contain a port number.");
info(`database name in the URI: ${parsed.database || '(none, so the driver uses "test")'}`);
const safeKeys = ["retryWrites", "w", "appName", "authSource", "replicaSet", "tls", "ssl", "directConnection", "readPreference", "maxPoolSize", "serverSelectionTimeoutMS", "connectTimeoutMS"];
const present = safeKeys.filter((k) => parsed.params.has(k)).map((k) => `${k}=${parsed.params.get(k)}`);
info(`options in the URI: ${present.length ? present.join(", ") : "(none of the common ones)"}`);
const others = [...parsed.params.keys()].filter((k) => !safeKeys.includes(k));
if (others.length) info(`other option names: ${others.join(", ")}`);
const tlsValue = parsed.params.get("tls") ?? parsed.params.get("ssl");
if (tlsValue === "false") bad("TLS is switched off in the URI. Atlas requires TLS.");
if (parsed.params.get("directConnection") === "true" && isSrv) bad("directConnection=true cannot be used with an SRV string.");
if (!isSrv && parsed.hosts.some((h) => h.name.endsWith(".mongodb.net"))) {
  // An SRV string gets these from the cluster's TXT record. A standard string must spell them out.
  if (tlsValue !== "true") bad("a standard string for Atlas needs tls=true (or ssl=true). Atlas refuses unencrypted connections.");
  if (parsed.database && !parsed.params.has("authSource")) bad("a database name is given but authSource is not: add authSource=admin, or authentication will be checked against the wrong database.");
  if (!parsed.params.has("replicaSet")) info("note: no replicaSet=... option. Atlas's own standard string includes it; add it if the connection is unstable.");
  if (parsed.hosts.length < 3) info(`note: only ${parsed.hosts.length} host(s) listed. Atlas clusters normally list three.`);
}

// ---- 2. DNS / reachability -------------------------------------------------------------------------
if (isSrv) {
  const host = parsed.hosts[0]?.name ?? "";
  step(2, "DNS as Node sees it (this is the lookup that fails with 'querySrv EBADRESP')");
  const srvName = `_mongodb._tcp.${host}`;
  const t0 = Date.now();
  let systemFailed = false;
  try {
    const records = await dns.promises.resolveSrv(srvName);
    ok(`system resolver answered the SRV query in ${Date.now() - t0} ms: ${records.map((r) => `${r.name}:${r.port}`).join(", ")}`);
  } catch (error) {
    systemFailed = true;
    bad(`system resolver FAILED for ${srvName}: ${describeError(error)}`);
    info("nslookup can succeed while this fails: nslookup uses its own DNS client, Node uses the c-ares resolver.");
  }
  let working = null;
  if (systemFailed) {
    for (const server of ["1.1.1.1", "8.8.8.8", "9.9.9.9"]) {
      const resolver = new dns.promises.Resolver({ timeout: 3000, tries: 2 });
      resolver.setServers([server]);
      try {
        const records = await resolver.resolveSrv(srvName);
        ok(`Node using public DNS ${server}: WORKS (${records.length} records)`);
        working ??= { resolver, records };
      } catch (e) {
        bad(`Node using public DNS ${server}: ${describeError(e)}`);
      }
    }
  }
  try {
    const txt = await dns.promises.resolveTxt(host);
    ok(`TXT record found (${txt.length}); it carries authSource and replicaSet for the cluster`);
  } catch (error) {
    bad(`TXT lookup failed with the system resolver: ${describeError(error)}`);
  }

  if (systemFailed && working) {
    step("2b", "Workaround: the same connection as a standard (non-SRV) string");
    let txtRecords = [];
    try {
      txtRecords = await working.resolver.resolveTxt(host);
    } catch (error) {
      bad(`could not read the TXT record through public DNS: ${describeError(error)}`);
    }
    const template = buildStandardTemplate({ srvRecords: working.records, txtRecords, original: parsed });
    if (txtRecords.length === 0) {
      bad("the line below is MISSING authSource and replicaSet because the TXT record could not be read. For Atlas use authSource=admin and add the replicaSet name shown in Atlas's own standard string.");
    }
    ok("built from the cluster's own DNS answers. It contains no credentials. Copy this line:");
    line();
    line(`MONGODB_URI=${template}`);
    line();
    info("Then replace <username>:<password> with the SAME username:password that is in your current MONGODB_URI");
    info("(the password stays URL-encoded, exactly as it is now). Save .env.local, restart the dev server, run this check again.");
    info("Testing that this machine can actually reach those servers on port 27017:");
    await probeAll(working.records.map((r) => ({ name: r.name.replace(/\.$/, ""), port: r.port })));
  }
} else {
  step(2, "Standard string: no SRV lookup is needed. Checking each host resolves and is reachable");
  for (const h of parsed.hosts) {
    try {
      const addresses = await dns.promises.lookup(h.name, { all: true });
      ok(`${h.name} resolves to ${addresses.map((a) => a.address).join(", ")}`);
    } catch (error) {
      bad(`${h.name} did not resolve: ${describeError(error)}`);
    }
  }
  await probeAll(parsed.hosts);
}

// ---- 3. driver connection --------------------------------------------------------------------------
step(3, "Driver connection (same call the app makes, 8 second limit)");
let mongoose = null;
try {
  mongoose = (await import("mongoose")).default;
} catch (error) {
  bad(`could not load mongoose: ${describeError(error)} (run npm install)`);
}
let connected = false;
if (mongoose) {
  try {
    await mongoose.connect(raw, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
    await mongoose.connection.db.admin().ping();
    connected = true;
    ok(`connected and pinged. database: ${mongoose.connection.name}`);
  } catch (error) {
    bad(`connection FAILED: ${describeError(error)}`);
    const servers = error?.reason?.servers;
    if (servers && typeof servers.forEach === "function") {
      servers.forEach((desc, address) => info(`server ${address}: ${desc.type}${desc.error ? ` | ${describeError(desc.error)}` : ""}`));
    }
    const message = String(error?.message ?? "");
    if (/whitelist|allowlist|IP that isn't|not allowed/i.test(message)) info("hint: add your current IP under Atlas > Network Access.");
    if (/bad auth|Authentication failed|code 18|AuthenticationFailed/i.test(message + String(error?.codeName ?? ""))) info("hint: username or password rejected. Check the database user in Atlas > Database Access, and that the password is URL-encoded.");
    if (/ssl|tls|certificate|handshake/i.test(message)) info("hint: a TLS problem. For a standard string make sure it has tls=true (or ssl=true). Antivirus or a proxy that inspects HTTPS can also cause this.");
    if (/EBADRESP|ENOTFOUND|ECONNREFUSED|querySrv|ETIMEOUT/i.test(message)) info("hint: a DNS problem, see step 2.");
  }
}

// ---- 4. users collection ---------------------------------------------------------------------------
if (connected) {
  step(4, "Users collection and first-admin seed");
  try {
    const db = mongoose.connection.db;
    const seedEmail = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
    info(["SEED_ADMIN_NAME", "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"].map((n) => `${n} ${(process.env[n] ?? "").trim() ? "set" : "NOT SET"}`).join(", "));
    const users = await mongoose.connection.db.collection(mongoose.pluralize()("user")).find({}, { projection: { email: 1, role: 1, active: 1, mustChangePassword: 1, failedAttempts: 1, lockedUntil: 1 } }).toArray();
    if (users.length === 0) {
      info("users collection is EMPTY. The first admin is created the first time the app touches the database");
      info("(any page load, or a sign-in attempt) if all three SEED_ADMIN_* variables are set. Start the app, load http://localhost:3000, run this check again.");
    } else {
      ok(`${users.length} user(s):`);
      for (const u of users) info(`- ${u.email} | ${u.role} | active=${u.active} | mustChangePassword=${u.mustChangePassword} | failedAttempts=${u.failedAttempts ?? 0}${u.lockedUntil && new Date(u.lockedUntil) > new Date() ? " | LOCKED until " + new Date(u.lockedUntil).toISOString() : ""}`);
      if (seedEmail && !users.some((u) => u.email === seedEmail)) info(`note: no user has SEED_ADMIN_EMAIL (${seedEmail}). The seed only runs when the collection is empty.`);
    }
    const named = (m) => mongoose.pluralize()(m.toLowerCase());
    const marker = await db.collection(named("Meta")).findOne({ key: "default-content-seeded" });
    info(`default content seeded marker: ${marker ? "present" : "absent"}; pages ${await db.collection(named("Page")).countDocuments()}, posts ${await db.collection(named("Post")).countDocuments()}`);
  } catch (error) {
    bad(`could not read the collections: ${describeError(error)}`);
  }
}

// ---- 5. indexes (READ ONLY: nothing is created, changed or dropped here) -------------------------------
if (connected) {
  step(5, "Indexes (read only). The app creates any missing ones itself the next time it starts and touches the database");
  try {
    const db = mongoose.connection.db;
    const toCollection = (modelName) => mongoose.pluralize()(modelName.toLowerCase());
    const label = (keys) => Object.entries(keys).map(([k, v]) => `${k}:${v}`).join(",");
    const existingNames = new Set((await db.listCollections().toArray()).map((c) => c.name));
    for (const spec of EXPECTED_INDEXES) {
      const collection = toCollection(spec.model);
      const what = `${collection}(${label(spec.keys)})${spec.unique ? " unique" : ""}${spec.expireAfterSeconds !== undefined ? " expiring" : ""}`;
      if (!existingNames.has(collection)) {
        (spec.unique ? bad : info)(`${what}: collection does not exist yet${spec.unique ? " (created on first use, together with its indexes)" : ""}`);
        continue;
      }
      const indexes = await db.collection(collection).indexes();
      const match = indexes.find((i) => JSON.stringify(i.key) === JSON.stringify(spec.keys));
      if (match && Boolean(match.unique) === Boolean(spec.unique)) {
        ok(`${what}: present`);
        continue;
      }
      if (match) {
        bad(`${what}: an index on these fields exists but is ${spec.unique ? "NOT unique" : "different"} (the app will not change it; see the docs)`);
        continue;
      }
      (spec.unique ? bad : info)(`${what}: MISSING${spec.unique ? "" : " (only affects speed)"}`);
      if (spec.unique && Object.keys(spec.keys).length === 1) {
        const field = Object.keys(spec.keys)[0];
        const duplicates = await db.collection(collection).aggregate([{ $group: { _id: `$${field}`, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $limit: 5 }]).toArray();
        if (duplicates.length > 0) {
          bad(`  it cannot be created: ${duplicates.length}+ value(s) of "${field}" are duplicated in ${collection}${field === "email" ? "" : ": " + duplicates.map((d) => d._id).join(", ")}. Remove or rename the duplicates by hand; nothing was changed.`);
        } else {
          info("  no duplicates found, so the app will be able to create it.");
        }
      }
    }
  } catch (error) {
    bad(`could not check the indexes: ${describeError(error)}`);
  }
}

if (mongoose) await mongoose.disconnect().catch(() => undefined);
line();
console.log(failures === 0 ? "RESULT: everything checked is fine." : `RESULT: ${failures} problem(s) found. The first ✘ above is the one to fix.`);
process.exit(failures === 0 ? 0 : 1);
