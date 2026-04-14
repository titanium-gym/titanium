import { Resend } from "resend";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export type ExpiryMemberInfo = {
  full_name: string;
  phone: string | null;
  fee_amount: number;
  expires_at: string;
};

export async function sendExpiryDigest(
  members: ExpiryMemberInfo[],
  type: "warning" | "expired"
) {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) throw new Error("Missing OWNER_EMAIL");

  const isWarning = type === "warning";
  const warningDays = Number(process.env.EXPIRY_WARNING_DAYS ?? 3);
  const subject = isWarning
    ? `⚠️ ${members.length} socio(s) vencen en ${warningDays} día(s)`
    : `🔴 ${members.length} socio(s) han vencido hoy`;

  const rows = members
    .map(
      (m) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.full_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.phone ?? "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">€${Number(m.fee_amount).toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.expires_at}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:${isWarning ? "#d97706" : "#dc2626"}">${subject}</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left">Nombre</th>
            <th style="padding:8px 12px;text-align:left">Teléfono</th>
            <th style="padding:8px 12px;text-align:left">Cuota</th>
            <th style="padding:8px 12px;text-align:left">Vencimiento</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:12px;margin-top:16px">Enviado automáticamente por el sistema de gestión del gimnasio.</p>
    </div>
  `;

  await getResendClient().emails.send({
    from: "Gimnasio <no-reply@resend.dev>",
    to: ownerEmail,
    subject,
    html,
  });
}
