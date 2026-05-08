import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock requireAuth to return a session
vi.mock("@/lib/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { email: "test@test.com" } }),
}));

// Mock Supabase client
const mockPayments = [
  { id: 1, member_id: 1, fee_amount: 30, paid_at: "2025-01-01", expires_at: "2025-02-01", created_at: "2025-01-01T00:00:00Z" },
  { id: 2, member_id: 1, fee_amount: 30, paid_at: "2025-02-01", expires_at: "2025-03-01", created_at: "2025-02-01T00:00:00Z" },
];

const selectMock = vi.fn().mockReturnThis();
const eqMock = vi.fn().mockReturnThis();
const orderMock = vi.fn().mockResolvedValue({ data: mockPayments, error: null });

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: selectMock,
      eq: eqMock,
      order: orderMock,
    })),
  })),
}));

// Import AFTER mocks are set up
const { GET } = await import("@/app/api/members/[id]/payments/route");

describe("GET /api/members/[id]/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnThis();
    eqMock.mockReturnThis();
    orderMock.mockResolvedValue({ data: mockPayments, error: null });
  });

  it("returns 200 with payment list for valid member id", async () => {
    const params = Promise.resolve({ id: "1" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ member_id: 1, fee_amount: 30 });
  });

  it("returns 400 for non-numeric id", async () => {
    const params = Promise.resolve({ id: "abc" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const { requireAuth } = await import("@/lib/require-auth");
    vi.mocked(requireAuth).mockResolvedValueOnce(null);
    const params = Promise.resolve({ id: "1" });
    const res = await GET({} as Request, { params });
    expect(res.status).toBe(401);
  });
});
