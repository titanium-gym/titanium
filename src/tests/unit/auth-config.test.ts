import { describe, it, expect, beforeEach } from "vitest";
import { getAllowedEmails, isSessionEmailAllowed } from "@/auth.config";

describe("getAllowedEmails", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns parsed list from ALLOWED_EMAILS", () => {
    vi.stubEnv("ALLOWED_EMAILS", "owner@gmail.com,user@gmail.com");
    expect(getAllowedEmails()).toEqual(["owner@gmail.com", "user@gmail.com"]);
  });

  it("trims whitespace around entries", () => {
    vi.stubEnv("ALLOWED_EMAILS", " owner@gmail.com , user@gmail.com ");
    expect(getAllowedEmails()).toEqual(["owner@gmail.com", "user@gmail.com"]);
  });

  it("returns single-item list", () => {
    vi.stubEnv("ALLOWED_EMAILS", "owner@gmail.com");
    expect(getAllowedEmails()).toEqual(["owner@gmail.com"]);
  });

  it("returns empty list when env var is not set", () => {
    expect(getAllowedEmails()).toEqual([]);
  });

  it("returns empty list for empty string", () => {
    vi.stubEnv("ALLOWED_EMAILS", "");
    expect(getAllowedEmails()).toEqual([]);
  });

  it("normalizes to lowercase", () => {
    vi.stubEnv("ALLOWED_EMAILS", "Owner@Gmail.COM,USER@EXAMPLE.COM");
    expect(getAllowedEmails()).toEqual(["owner@gmail.com", "user@example.com"]);
  });
});

describe("isSessionEmailAllowed", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("ALLOWED_EMAILS", "owner@gmail.com,user@gmail.com");
  });

  it("allows first email in the list", () => {
    expect(isSessionEmailAllowed("owner@gmail.com")).toBe(true);
  });

  it("allows second email in the list", () => {
    expect(isSessionEmailAllowed("user@gmail.com")).toBe(true);
  });

  it("denies an unknown email", () => {
    expect(isSessionEmailAllowed("attacker@gmail.com")).toBe(false);
  });

  it("denies null", () => {
    expect(isSessionEmailAllowed(null)).toBe(false);
  });

  it("denies undefined", () => {
    expect(isSessionEmailAllowed(undefined)).toBe(false);
  });

  it("denies empty string", () => {
    expect(isSessionEmailAllowed("")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isSessionEmailAllowed("OWNER@GMAIL.COM")).toBe(true);
    expect(isSessionEmailAllowed("User@Gmail.Com")).toBe(true);
  });

  it("denies when ALLOWED_EMAILS is not set", () => {
    vi.unstubAllEnvs();
    expect(isSessionEmailAllowed("owner@gmail.com")).toBe(false);
  });

  it("works with more than two emails", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ALLOWED_EMAILS", "a@x.com,b@x.com,c@x.com");
    expect(isSessionEmailAllowed("b@x.com")).toBe(true);
    expect(isSessionEmailAllowed("d@x.com")).toBe(false);
  });
});
