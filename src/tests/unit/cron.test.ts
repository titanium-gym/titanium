import { describe, it, expect, vi } from "vitest";

// We test the cron logic by mocking supabase and email
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendExpiryDigest: vi.fn().mockResolvedValue(undefined),
}));

describe("cron check-expiry logic", () => {
  it("GET without authorization returns 401", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { GET } = await import(
      "@/app/api/cron/check-expiry/route"
    );
    const req = new Request("http://localhost/api/cron/check-expiry");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET with wrong secret returns 401", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { GET } = await import(
      "@/app/api/cron/check-expiry/route"
    );
    const req = new Request("http://localhost/api/cron/check-expiry", {
      headers: { authorization: "Bearer wrongsecret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
