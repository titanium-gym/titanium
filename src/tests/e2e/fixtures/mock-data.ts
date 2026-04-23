/**
 * Mock data for E2E tests
 * These fixtures prevent tests from touching the production database
 */

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const mockMembers = Array.from({ length: 50 }, (_, i) => {
  // Distribute across statuses: expired, expiring-soon, active
  let paid_at: string;
  let expires_at: string;
  const bucket = i % 6;
  if (bucket === 0) {
    paid_at = offsetDate(-90); expires_at = offsetDate(-60); // expired 2 months ago
  } else if (bucket === 1) {
    paid_at = offsetDate(-45); expires_at = offsetDate(-15); // expired recently
  } else if (bucket === 2) {
    paid_at = offsetDate(-28); expires_at = offsetDate(3);   // expiring-soon
  } else if (bucket === 3) {
    paid_at = offsetDate(-28); expires_at = offsetDate(6);   // expiring-soon
  } else if (bucket === 4) {
    paid_at = offsetDate(-15); expires_at = offsetDate(15);  // active
  } else {
    paid_at = offsetDate(-5);  expires_at = offsetDate(25);  // active, recent
  }

  return {
    id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
    full_name: `Socio ${String(i + 1).padStart(3, "0")}`,
    phone: i % 2 === 0 ? `+34 6${String(i * 13 + 10000000).padStart(8, "0")}` : null,
    fee_amount: i % 2 === 0 ? 30 : 35,
    paid_at,
    expires_at,
    notes: i % 5 === 0 ? "Nota de prueba" : null,
    created_at: new Date(2024, 0, 1).toISOString(),
    updated_at: new Date(2024, 0, 1).toISOString(),
  };
});

export const mockMember = {
  id: 999,
  full_name: "Nuevo Socio",
  phone: "+34 612345678",
  fee_amount: 30,
  paid_at: offsetDate(-15),
  expires_at: offsetDate(15),
  notes: "Socio de prueba",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockUpdateMember = {
  id: 999,
  full_name: "Nuevo Socio Actualizado",
  phone: "+34 623456789",
  fee_amount: 35,
  paid_at: offsetDate(-10),
  expires_at: offsetDate(20),
  notes: "Actualizado",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockRenewalResponse = {
  success: true,
  member: {
    id: 1,
    full_name: "Socio 001",
    expires_at: offsetDate(30),
  },
};

export const mockErrorResponse = {
  error: "Not found",
};
