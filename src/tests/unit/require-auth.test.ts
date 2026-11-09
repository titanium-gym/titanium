import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @/auth before importing requireAuth so the module resolves the mock.
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireAuth, requirePageAuth } from "@/lib/require-auth";

const mockAuth = vi.mocked(auth);

describe("requireAuth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockAuth.mockReset();
  });

  it("returns a bypass user when BYPASS_AUTH=true in non-production", async () => {
    vi.stubEnv("BYPASS_AUTH", "true");
    vi.stubEnv("NODE_ENV", "test");

    const result = await requireAuth();

    expect(result).toEqual({ user: { email: "dev@localhost", name: "Dev" } });
    // auth() must NOT be called — the bypass short-circuits before it
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("does NOT bypass in production even when BYPASS_AUTH=true", async () => {
    vi.stubEnv("BYPASS_AUTH", "true");
    vi.stubEnv("NODE_ENV", "production");
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result).toBeNull();
    expect(mockAuth).toHaveBeenCalledOnce();
  });

  it("returns null when there is no session (unauthenticated)", async () => {
    vi.stubEnv("BYPASS_AUTH", "false");
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result).toBeNull();
  });

  it("returns the session when the user is authenticated", async () => {
    vi.stubEnv("BYPASS_AUTH", "false");
    vi.stubEnv("ALLOWED_EMAILS", "user@example.com");
    const session = { user: { email: "user@example.com", name: "Test User" } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValueOnce(session as any);

    const result = await requireAuth();

    expect(result).toEqual(session);
  });

  it("returns null when the session email is no longer allowed", async () => {
    vi.stubEnv("BYPASS_AUTH", "false");
    vi.stubEnv("ALLOWED_EMAILS", "other@example.com");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValueOnce({ user: { email: "user@example.com" } } as any);

    const result = await requireAuth();

    expect(result).toBeNull();
  });
});

describe("requirePageAuth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockAuth.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it("redirects to /login when there is no session", async () => {
    vi.stubEnv("BYPASS_AUTH", "false");
    mockAuth.mockResolvedValueOnce(null);

    await expect(requirePageAuth()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the session for an allowed user", async () => {
    vi.stubEnv("BYPASS_AUTH", "false");
    vi.stubEnv("ALLOWED_EMAILS", "user@example.com");
    const session = { user: { email: "user@example.com" } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValueOnce(session as any);

    await expect(requirePageAuth()).resolves.toEqual(session);
    expect(redirect).not.toHaveBeenCalled();
  });
});
