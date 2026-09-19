import { ENV } from "./_core/env";

export type InvitationEmailStatus = "sent" | "not_configured" | "failed";

export async function sendInvitationEmail(input: { to: string; role: string; inviteUrl: string; expiresAt: Date }): Promise<InvitationEmailStatus> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return "not_configured";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [input.to],
        subject: "Convite para o Portal de Turismo Municipal",
        text: `Você recebeu um convite para acessar o Portal de Turismo Municipal como ${input.role}. Acesse: ${input.inviteUrl}. Este link expira em ${input.expiresAt.toLocaleDateString("pt-BR")}.`,
        html: `<div style="font-family:Arial,sans-serif;color:#123f36"><h2>Convite para o Portal de Turismo Municipal</h2><p>Você recebeu um convite para acessar o portal como <strong>${input.role}</strong>.</p><p><a href="${input.inviteUrl}" style="background:#0d5c4d;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Aceitar convite</a></p><p>O link expira em ${input.expiresAt.toLocaleDateString("pt-BR")}.</p></div>`,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
