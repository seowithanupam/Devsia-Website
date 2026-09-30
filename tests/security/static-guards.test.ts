import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static checks on the source tree. They cannot prove the app is secure, but they catch the mistakes that are
 * easiest to make later: an admin page or server action added without a permission check, a database or
 * secret import reaching client code, or a CRM call appearing before the CRM is integrated.
 */

const root = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", ".git"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(root);
const src = all.filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".d.ts") && !relative(root, f).startsWith("tests"));
const rel = (f: string) => relative(root, f).split("\\").join("/");
const read = (f: string) => readFileSync(f, "utf8");

describe("admin pages", () => {
  const pages = all.filter((f) => /app\/admin\/.*page\.tsx$/.test(rel(f)) && !rel(f).includes("/login/"));
  it("finds the admin pages", () => {
    expect(pages.length).toBe(19);
  });
  it("checks the session on every admin page (the layout alone is not enough)", () => {
    for (const page of pages) {
      expect(/requireUser\(|requireCapability\(/.test(read(page)), `${rel(page)} has no server-side session check`).toBe(true);
    }
  });
  it("requires a specific capability on every page except dashboard, profile and no-access", () => {
    for (const page of pages) {
      const name = rel(page);
      const open = name.endsWith("(console)/page.tsx") || name.includes("/profile/") || name.includes("/forbidden/");
      if (!open) expect(/requireCapability\("[a-z]+\.[a-z]+"\)/.test(read(page)), `${name} does not name a capability`).toBe(true);
    }
  });
  it("gives the pages the capability the handover names", () => {
    const expected: Record<string, string> = {
      "pages/page.tsx": "pages.manage",
      "pages/[slug]/page.tsx": "pages.manage",
      "blogs/page.tsx": "blogs.manage",
      "blogs/new/page.tsx": "blogs.manage",
      "blogs/[id]/page.tsx": "blogs.manage",
      "nav/page.tsx": "nav.manage",
      "media/page.tsx": "media.manage",
      "seo/page.tsx": "seo.manage",
      "seo/pages/[slug]/page.tsx": "seo.manage",
      "seo/property/[slug]/page.tsx": "seo.manage",
      "legal/page.tsx": "pages.manage",
      "settings/page.tsx": "settings.manage",
      "leads/page.tsx": "leads.view",
      "leads/[id]/page.tsx": "leads.view",
      "roles/page.tsx": "roles.manage",
      "audit/page.tsx": "audit.view",
    };
    for (const [file, capability] of Object.entries(expected)) {
      const text = read(join(root, "app/admin/(console)", file));
      expect(text, file).toContain(`requireCapability("${capability}")`);
    }
  });
});

describe("admin server actions", () => {
  const files = all.filter((f) => /app\/admin\/actions\/[a-z]+\.ts$/.test(rel(f)));
  it("finds the action files", () => {
    expect(files.length).toBe(11);
  });
  it('marks every action file "use server" and exports only async functions', () => {
    for (const f of files) {
      const text = read(f);
      expect(text.trimStart().startsWith('"use server"'), rel(f)).toBe(true);
      const exports = [...text.matchAll(/^export\s+(.*)$/gm)].map((m) => m[1]);
      for (const e of exports) expect(e.startsWith("async function "), `${rel(f)}: ${e.slice(0, 40)}`).toBe(true);
    }
  });
  it("runs every action (except sign-in and sign-out) through the permission guard", () => {
    for (const f of files.filter((x) => !rel(x).endsWith("/auth.ts"))) {
      const text = read(f);
      const actions = [...text.matchAll(/^export async function (\w+)\(([^)]*)\)[^{]*\{([\s\S]*?)^\}/gm)];
      expect(actions.length, rel(f)).toBeGreaterThan(0);
      for (const [, name, , body] of actions) expect(/return runAction\(/.test(body), `${rel(f)} ${name} skips runAction`).toBe(true);
    }
  });
  it("gives each action file the capability the handover names", () => {
    const expected: Record<string, string> = { pages: "pages.manage", posts: "blogs.manage", nav: "nav.manage", settings: "settings.manage", seo: "seo.manage", legal: "pages.manage", media: "media.manage", users: "roles.manage", content: "settings.manage" };
    for (const [file, capability] of Object.entries(expected)) {
      const text = read(join(root, "app/admin/actions", `${file}.ts`));
      const uses = [...text.matchAll(/runAction\(\s*("[a-z.]+"|null)/g)].map((m) => m[1]);
      expect(uses.length, file).toBeGreaterThan(0);
      for (const u of uses) expect(u, file).toBe(`"${capability}"`);
    }
    const profile = read(join(root, "app/admin/actions/profile.ts"));
    expect([...profile.matchAll(/runAction\(\s*("[a-z.]+"|null)/g)].map((m) => m[1])).toEqual(["null", "null"]);
  });
});

describe("secrets and server-only code", () => {
  const clientFiles = src.filter((f) => read(f).trimStart().startsWith('"use client"'));
  it("finds client components", () => {
    expect(clientFiles.length).toBeGreaterThan(20);
  });
  it("never imports the database, repositories, auth internals or the password code into a client component", () => {
    const forbidden = /from\s+["'](@\/lib\/db|@\/lib\/cms\/repo|@\/auth|@\/lib\/auth\/(session|guard|password|authorize)|mongoose|bcryptjs|@vercel\/blob)/;
    for (const f of clientFiles) expect(forbidden.test(read(f)), `${rel(f)} imports server-only code`).toBe(false);
  });
  it("reads secrets only from server files", () => {
    const secret = /process\.env\.(MONGODB_URI|AUTH_SECRET|SEED_ADMIN_\w+|BLOB_READ_WRITE_TOKEN|DEVSIA_API_\w+)/;
    for (const f of clientFiles) expect(secret.test(read(f)), rel(f)).toBe(false);
  });
  it("uses NEXT_PUBLIC_ only for the site URL", () => {
    for (const f of src) {
      const uses = [...read(f).matchAll(/NEXT_PUBLIC_\w+/g)].map((m) => m[0]);
      for (const u of uses) expect(u, rel(f)).toBe("NEXT_PUBLIC_SITE_URL");
    }
  });
  it('marks database, repository, auth and password modules "server-only"', () => {
    const files = src.filter((f) => /^(lib\/db\/|lib\/cms\/repo\/|lib\/auth\/(session|guard|password|authorize)\.ts|lib\/cms\/public\.ts|lib\/content\/cms-provider\.ts)/.test(rel(f)));
    expect(files.length).toBeGreaterThan(12);
    for (const f of files) expect(read(f), rel(f)).toContain('import "server-only"');
  });
  it("hashes passwords and never stores or returns them plainly", () => {
    const users = read(join(root, "lib/cms/repo/users.ts"));
    expect(users).toContain("passwordHash");
    expect(read(join(root, "lib/cms/repo/seed-admin.ts"))).toContain("bcrypt.hash");
  });
});

describe("no CRM calls in Phase 3", () => {
  it("has no PropDesk variable or request outside the environment registry", () => {
    for (const f of src) {
      if (rel(f) === "lib/env.ts") continue;
      expect(/DEVSIA_API_|propdesk\.|software\.devsia\.in|api\/leads\/capture|associates\/register/i.test(read(f)), rel(f)).toBe(false);
    }
  });
  it("makes no outgoing HTTP request from server code", () => {
    for (const f of src.filter((x) => /^(lib|app\/admin|app\/api|auth\.ts)/.test(rel(x)))) {
      expect(/\bfetch\(\s*["'`]https?:/.test(read(f)), rel(f)).toBe(false);
    }
  });
  it("keeps the CRM variables optional and commented in .env.example", () => {
    const example = read(join(root, ".env.example"));
    for (const name of ["DEVSIA_API_BASE_URL", "DEVSIA_API_KEY", "DEVSIA_AGENCY_ID"]) {
      expect(example).toMatch(new RegExp(`^# ${name}=`, "m"));
    }
  });
});

describe("existing protections are kept", () => {
  it("keeps the four security headers and the powered-by removal", () => {
    const config = read(join(root, "next.config.ts"));
    for (const h of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) expect(config).toContain(h);
    expect(config).toContain("poweredByHeader: false");
  });
  it("keeps the Sriva Digital footer credit", () => {
    const footer = read(join(root, "components/layout/SiteFooter.tsx"));
    expect(footer).toContain("agencyCredit");
    expect(read(join(root, "lib/content/site.ts"))).toContain("https://srivadigital.com/");
  });
  it("disallows the admin panel in robots.txt", () => {
    expect(read(join(root, "app/robots.ts"))).toContain("/admin");
  });
  it("only allows the Blob host for remote images", () => {
    const config = read(join(root, "next.config.ts"));
    expect(config).toContain("*.public.blob.vercel-storage.com");
    expect(config.match(/hostname:/g)?.length).toBe(1);
  });
});

describe("code quality rules", () => {
  it("never switches an ESLint rule off with a comment", () => {
    for (const f of src) expect(/eslint-disable/.test(read(f)), `${rel(f)} disables an ESLint rule`).toBe(false);
  });
  it("does not read the clock while a page renders (the data layer does)", () => {
    for (const f of all.filter((x) => /app\/.*page\.tsx$/.test(rel(x)))) expect(/Date\.now\(\)/.test(read(f)), `${rel(f)} calls Date.now() in render`).toBe(false);
  });

  it("never hides the filters toggle with a base CSS rule (the jsdom test environment ignores media queries)", () => {
    const css = read(join(root, "components/property/property.module.css"));
    // Flatten the stylesheet into rules, remembering which @media block (if any) each one sits in.
    const rules: Array<{ media: string | null; selector: string; body: string }> = [];
    const scan = (text: string, media: string | null) => {
      let i = 0;
      while (i < text.length) {
        const open = text.indexOf("{", i);
        if (open === -1) break;
        const head = text.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
        let depth = 1;
        let j = open + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === "{") depth++;
          else if (text[j] === "}") depth--;
          j++;
        }
        const inner = text.slice(open + 1, j - 1);
        if (head.startsWith("@media")) scan(inner, head);
        else rules.push({ media, selector: head, body: inner });
        i = j;
      }
    };
    scan(css, null);

    const toggle = rules.filter((r) => r.selector === ".filterToggle");
    expect(toggle.length).toBeGreaterThan(0);
    for (const rule of toggle.filter((r) => r.media === null)) {
      expect(/display\s*:\s*none/.test(rule.body), "the base .filterToggle rule hides the button").toBe(false);
    }
    // It is hidden only for wide screens, using the exact complement of the phone breakpoint.
    const hiddenWhenWide = toggle.some((r) => r.media === "@media not all and (max-width: 809px)" && /display\s*:\s*none/.test(r.body));
    expect(hiddenWhenWide).toBe(true);
  });

  it("keeps the first-start setup from waiting on itself (it must use the direct audit write, never writeAudit)", () => {
    for (const file of ["lib/cms/repo/seed-admin.ts", "lib/cms/repo/seed-content.ts", "lib/db/bootstrap.ts", "lib/db/indexes.ts"]) {
      expect(/writeAudit\(/.test(read(join(root, file))), `${file} calls writeAudit(), which calls getDb() from inside getDb()`).toBe(false);
    }
    expect(read(join(root, "lib/cms/repo/seed-admin.ts"))).toContain("writeAuditDirect(");
  });
  it("uses the throttle and session-version checks in the places that matter", () => {
    expect(read(join(root, "lib/auth/authorize.ts"))).toContain("isNetworkBlocked(");
    expect(read(join(root, "lib/auth/session.ts"))).toContain("isSessionCurrent(");
    expect(read(join(root, "lib/cms/repo/users.ts"))).toMatch(/\$inc:\s*\{\s*sessionVersion:\s*1\s*\}/);
  });

  it("reads admin field errors only inside the form that provides them", () => {
    // useFieldError() reads a context that <AdminForm> provides. Called in the component that RENDERS <AdminForm>, it always sees "no errors".
    for (const file of all.filter((f) => /^components\/admin\/.*\.tsx$/.test(rel(f)))) {
      for (const chunk of read(file).split(/^(?=(?:export )?function \w+)/m)) {
        if (/<AdminForm\s/.test(chunk)) expect(chunk.includes("useFieldError("), `${rel(file)}: a component that renders <AdminForm> reads field errors above the provider, so they never show`).toBe(false);
      }
    }
  });
});

