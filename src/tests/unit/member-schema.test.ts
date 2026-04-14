import { describe, it, expect } from "vitest";
import { memberSchema } from "@/lib/schemas/member";

describe("memberSchema", () => {
  const valid = {
    full_name: "Juan García",
    phone: "600000000",
    fee_amount: 30,
    paid_at: "2024-01-01",
    expires_at: "2024-02-01",
  };

  it("accepts a valid member", () => {
    const result = memberSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("requires full_name", () => {
    const result = memberSchema.safeParse({ ...valid, full_name: "" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.flatten())).toContain("full_name");
  });

  it("rejects fee_amount of 0", () => {
    const result = memberSchema.safeParse({ ...valid, fee_amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative fee_amount", () => {
    const result = memberSchema.safeParse({ ...valid, fee_amount: -10 });
    expect(result.success).toBe(false);
  });

  it("accepts fee_amount of 35", () => {
    const result = memberSchema.safeParse({ ...valid, fee_amount: 35 });
    expect(result.success).toBe(true);
  });

  it("rejects fee_amount not in [30, 35]", () => {
    const result = memberSchema.safeParse({ ...valid, fee_amount: 25 });
    expect(result.success).toBe(false);
  });

  it("requires paid_at", () => {
    const result = memberSchema.safeParse({ ...valid, paid_at: "" });
    expect(result.success).toBe(false);
  });

  it("requires expires_at", () => {
    const result = memberSchema.safeParse({ ...valid, expires_at: "" });
    expect(result.success).toBe(false);
  });

  it("rejects expires_at before paid_at", () => {
    const result = memberSchema.safeParse({
      ...valid,
      paid_at: "2024-02-01",
      expires_at: "2024-01-01",
    });
    expect(result.success).toBe(false);
    const errorStr = JSON.stringify(result.error?.flatten());
    expect(errorStr).toContain("expires_at");
  });

  it("allows phone to be empty", () => {
    const result = memberSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(true);
  });

  it("allows phone to be undefined", () => {
    const { phone: _phone, ...withoutPhone } = valid;
    const result = memberSchema.safeParse(withoutPhone);
    expect(result.success).toBe(true);
  });
});
