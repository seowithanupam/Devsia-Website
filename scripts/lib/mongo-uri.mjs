// Helpers for scripts/db-check.mjs (temporary diagnostic). Pure functions, no I/O, so they can be tested.

/**
 * Splits a MongoDB connection string. The WHATWG URL parser cannot be used: it rejects the comma-separated
 * host list of a standard (non-SRV) string. Returns null when the string does not start with mongodb:// or mongodb+srv://.
 * @param {string} raw
 */
export function parseMongoUri(raw) {
  const match = /^(mongodb\+srv|mongodb):\/\/([\s\S]*)$/i.exec(raw);
  if (!match) return null;
  const scheme = match[1].toLowerCase();
  const rest = match[2];

  // The authority (user info + hosts) ends at the first "/" or "?". User info ends at the LAST "@" inside it,
  // so a password with a raw "@" is still split in the same place the driver would split it.
  const delimiter = rest.search(/[/?]/);
  const authorityEnd = delimiter === -1 ? rest.length : delimiter;
  const authority = rest.slice(0, authorityEnd);
  const at = authority.lastIndexOf("@");
  const userInfo = at >= 0 ? authority.slice(0, at) : "";
  const hostList = at >= 0 ? authority.slice(at + 1) : authority;

  const tail = rest.slice(authorityEnd);
  const questionMark = tail.indexOf("?");
  const pathPart = questionMark === -1 ? tail : tail.slice(0, questionMark);
  const query = questionMark === -1 ? "" : tail.slice(questionMark + 1);

  const colon = userInfo.indexOf(":");
  const hosts = hostList
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const parts = /^(.*?)(?::(\d+))?$/.exec(entry);
      return { name: parts ? parts[1] : entry, port: parts && parts[2] ? Number(parts[2]) : null };
    });

  return {
    scheme,
    username: colon === -1 ? userInfo : userInfo.slice(0, colon),
    password: colon === -1 ? "" : userInfo.slice(colon + 1),
    /** "@" characters left in the user info: each one should have been written %40. */
    rawAtSigns: (userInfo.match(/@/g) ?? []).length,
    hosts,
    database: pathPart.replace(/^\//, ""),
    params: new URLSearchParams(query),
  };
}

const CARRY_OVER = ["retryWrites", "w", "appName", "readPreference", "maxPoolSize", "connectTimeoutMS", "serverSelectionTimeoutMS"];

/**
 * Builds the standard-string equivalent of an SRV string from the cluster's own DNS answers.
 * The SRV lookup supplies the host list and the TXT record supplies replicaSet and authSource: this is exactly
 * what a driver does when it expands mongodb+srv://. The result contains NO credentials, only the placeholder
 * "<username>:<password>", and keeps the database name and safe options of the original string.
 * @param {{ srvRecords: Array<{name: string, port: number}>, txtRecords: string[][], original: ReturnType<typeof parseMongoUri> }} input
 */
export function buildStandardTemplate({ srvRecords, txtRecords, original }) {
  const hosts = srvRecords.map((r) => `${r.name.replace(/\.$/, "")}:${r.port}`).join(",");
  const txt = new URLSearchParams(txtRecords.map((chunks) => chunks.join("")).join("&"));
  const options = new URLSearchParams();
  for (const key of ["authSource", "replicaSet"]) if (txt.has(key)) options.set(key, txt.get(key));
  options.set("ssl", "true");
  for (const key of CARRY_OVER) {
    if (original?.params.has(key) && !options.has(key)) options.set(key, original.params.get(key));
  }
  return `mongodb://<username>:<password>@${hosts}/${original?.database ?? ""}?${options.toString()}`;
}
