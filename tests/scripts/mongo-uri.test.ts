import { describe, expect, it } from "vitest";
import { buildStandardTemplate, parseMongoUri } from "@/scripts/lib/mongo-uri.mjs";

// Made-up names only. No real host, user or password appears in this file.
const STANDARD =
  "mongodb://appuser:p%40ss%24w0rd@ac-abc-shard-00-00.x1y2z3.mongodb.net:27017,ac-abc-shard-00-01.x1y2z3.mongodb.net:27017,ac-abc-shard-00-02.x1y2z3.mongodb.net:27017/devsia?ssl=true&replicaSet=atlas-abc-shard-0&authSource=admin&retryWrites=true&w=majority";

describe("parseMongoUri", () => {
  it("reads a multi-host standard string (which new URL() rejects)", () => {
    const p = parseMongoUri(STANDARD);
    expect(p).not.toBeNull();
    expect(p?.scheme).toBe("mongodb");
    expect(p?.hosts.map((h) => `${h.name}:${h.port}`)).toEqual([
      "ac-abc-shard-00-00.x1y2z3.mongodb.net:27017",
      "ac-abc-shard-00-01.x1y2z3.mongodb.net:27017",
      "ac-abc-shard-00-02.x1y2z3.mongodb.net:27017",
    ]);
    expect(p?.database).toBe("devsia");
    expect(p?.params.get("replicaSet")).toBe("atlas-abc-shard-0");
    expect(p?.params.get("authSource")).toBe("admin");
    expect(p?.username).toBe("appuser");
    expect(p?.password).toBe("p%40ss%24w0rd");
    expect(p?.rawAtSigns).toBe(0);
  });

  it("reads an SRV string and a string with no database name", () => {
    const p = parseMongoUri("mongodb+srv://u:pw@cluster0.abc.mongodb.net/?retryWrites=true&w=majority&appName=devsia");
    expect(p?.scheme).toBe("mongodb+srv");
    expect(p?.hosts).toEqual([{ name: "cluster0.abc.mongodb.net", port: null }]);
    expect(p?.database).toBe("");
    expect(p?.params.get("appName")).toBe("devsia");
  });

  it("counts unencoded @ signs in the password and splits where the driver would", () => {
    const p = parseMongoUri("mongodb+srv://u:pa@ss@cluster0.abc.mongodb.net/db");
    expect(p?.rawAtSigns).toBe(1);
    expect(p?.hosts[0].name).toBe("cluster0.abc.mongodb.net");
    expect(p?.password).toBe("pa@ss");
  });

  it("rejects anything that is not a MongoDB connection string", () => {
    expect(parseMongoUri("https://example.com")).toBeNull();
    expect(parseMongoUri("cluster0.abc.mongodb.net")).toBeNull();
    expect(parseMongoUri("")).toBeNull();
  });
});

describe("buildStandardTemplate", () => {
  const original = parseMongoUri("mongodb+srv://u:pw@cluster0.abc.mongodb.net/devsia?retryWrites=true&w=majority&appName=devsia");
  const srvRecords = [
    { name: "ac-abc-shard-00-00.abc.mongodb.net", port: 27017 },
    { name: "ac-abc-shard-00-01.abc.mongodb.net.", port: 27017 },
    { name: "ac-abc-shard-00-02.abc.mongodb.net", port: 27017 },
  ];
  const txtRecords = [["authSource=admin&replicaSet=atlas-abc-shard-0"]];

  it("expands the SRV answers the way a driver does, with placeholders instead of credentials", () => {
    const t = buildStandardTemplate({ srvRecords, txtRecords, original });
    expect(t).toBe(
      "mongodb://<username>:<password>@ac-abc-shard-00-00.abc.mongodb.net:27017,ac-abc-shard-00-01.abc.mongodb.net:27017,ac-abc-shard-00-02.abc.mongodb.net:27017/devsia?authSource=admin&replicaSet=atlas-abc-shard-0&ssl=true&retryWrites=true&w=majority&appName=devsia",
    );
  });

  it("keeps the database name, so the app does not silently switch to the default 'test' database", () => {
    expect(buildStandardTemplate({ srvRecords, txtRecords, original })).toContain("/devsia?");
  });

  it("copes with a TXT record split into chunks and with no database name", () => {
    const noDb = parseMongoUri("mongodb+srv://u:pw@cluster0.abc.mongodb.net/?w=majority");
    const t = buildStandardTemplate({ srvRecords, txtRecords: [["authSource=ad", "min&replicaSet=r0"]], original: noDb });
    expect(t).toContain("/?authSource=admin&replicaSet=r0&ssl=true&w=majority");
  });

  it("never contains a real credential (only the placeholder)", () => {
    const t = buildStandardTemplate({ srvRecords, txtRecords, original });
    expect(t).not.toContain("u:pw");
    expect(t).toContain("<username>:<password>");
  });
});
