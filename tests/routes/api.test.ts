// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET as getHello } from "@/app/api/v1/hello/route";
import { GET as getProperties } from "@/app/api/v1/properties/route";
import { POST as postLead } from "@/app/api/v1/leads/route";
import robots from "@/app/robots";
import { NEW_PROJECTS_LIVE } from "@/lib/config/features";

describe("API routes (mock providers)", () => {
  it("answers the health check", async () => {
    const response = getHello();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("lists properties and honours slugs", async () => {
    const all = await (await getProperties(new Request("http://localhost/api/v1/properties"))).json();
    expect(all.total).toBe(8);
    const one = await (await getProperties(new Request(`http://localhost/api/v1/properties?slugs=${all.items[0].slug}`))).json();
    expect(one.total).toBe(1);
  });

  it("rejects an invalid enquiry with 422 and field errors", async () => {
    const response = await postLead(
      new Request("http://localhost/api/v1/leads", { method: "POST", body: JSON.stringify({ fullName: "" }) }),
    );
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.errors.fullName).toBeTruthy();
  });

  it("rejects malformed JSON without throwing", async () => {
    const response = await postLead(new Request("http://localhost/api/v1/leads", { method: "POST", body: "not json" }));
    expect(response.status).toBe(422);
  });
});

describe("robots and flags", () => {
  it("blocks API routes and points to the sitemap", () => {
    const result = robots();
    expect(JSON.stringify(result.rules)).toContain("/api/");
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
  it("keeps /new-projects switched off until the CRM has pre-launch data", () => {
    expect(NEW_PROJECTS_LIVE).toBe(false);
  });
});
