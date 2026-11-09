// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { email: "test@test.com" } }),
}));

const singleMock = vi.fn();
const inMock = vi.fn();
const insertMock = vi.fn().mockResolvedValue({ error: null });

const builder = {
  select: () => builder,
  update: () => builder,
  eq: () => builder,
  in: inMock,
  single: singleMock,
  insert: insertMock,
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({ from: () => builder })),
}));

const { PUT } = await import("@/app/api/members/[id]/route");
const { POST } = await import("@/app/api/members/bulk-renew/route");

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api", { method, body: JSON.stringify(body) });
}

const put = (body: unknown) =>
  PUT(jsonRequest("PUT", body), { params: Promise.resolve({ id: "1" }) });

const member = (id: number) => ({
  id,
  fee_amount: 30,
  paid_at: "2025-02-01",
  expires_at: "2025-03-01",
});

describe("PUT /api/members/[id] payment history", () => {
  beforeEach(() => {
    singleMock.mockReset();
    insertMock.mockClear();
  });

  it("does not record a payment when paid_at is unchanged", async () => {
    singleMock
      .mockResolvedValueOnce({ data: { paid_at: "2025-02-01" }, error: null })
      .mockResolvedValueOnce({ data: member(1), error: null });

    const res = await put({ paid_at: "2025-02-01", notes: "typo fixed" });

    expect(res.status).toBe(200);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("records a payment when paid_at changes", async () => {
    singleMock
      .mockResolvedValueOnce({ data: { paid_at: "2025-01-01" }, error: null })
      .mockResolvedValueOnce({ data: member(1), error: null });

    await put({ paid_at: "2025-02-01", expires_at: "2025-03-01" });

    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ member_id: 1, paid_at: "2025-02-01" })
    );
  });

  it("skips the lookup when paid_at is not sent", async () => {
    singleMock.mockResolvedValueOnce({ data: member(1), error: null });

    await put({ notes: "only notes" });

    expect(singleMock).toHaveBeenCalledOnce();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the member does not exist", async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: { message: "no rows" } });

    const res = await put({ paid_at: "2025-02-01" });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/members/bulk-renew", () => {
  const renew = () => POST(jsonRequest("POST", { ids: ["1", "2"] }));

  beforeEach(() => {
    singleMock.mockReset();
    insertMock.mockClear();
    inMock.mockResolvedValue({
      data: [
        { id: 1, expires_at: "2025-03-01" },
        { id: 2, expires_at: "2025-03-01" },
      ],
      error: null,
    });
  });

  it("returns 200 and records every payment when all succeed", async () => {
    singleMock
      .mockResolvedValueOnce({ data: member(1), error: null })
      .mockResolvedValueOnce({ data: member(2), error: null });

    const res = await renew();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ failedIds: [] });
    expect(insertMock.mock.calls[0][0]).toHaveLength(2);
  });

  it("records payments for the renewed members on partial failure", async () => {
    singleMock
      .mockResolvedValueOnce({ data: member(1), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const res = await renew();
    const body = await res.json();

    expect(res.status).toBe(207);
    expect(body.failedIds).toEqual(["2"]);
    expect(body.updated).toHaveLength(1);
    expect(insertMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ member_id: 1 }),
    ]);
  });

  it("returns 500 without recording payments when all fail", async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    const res = await renew();

    expect(res.status).toBe(500);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
