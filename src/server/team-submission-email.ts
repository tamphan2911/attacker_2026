import { sendMail } from "@/server/mailer";

const ROUND2_UPLOAD_FROM = "Attacker 2026 <attacker@uel.edu.vn>";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTeamSubmissionUploadConfirmation({
  teamLeadEmail,
  teamLeadName,
  teamName,
  roundLabel,
  version,
  fileName,
  fileBuffer,
  mimeType,
}: {
  teamLeadEmail: string;
  teamLeadName: string;
  teamName: string;
  roundLabel: string;
  version: number;
  fileName: string;
  fileBuffer: Buffer;
  mimeType?: string;
}) {
  const safeName = teamLeadName.trim() || "team leader";
  const subject = `Attacker 2026 - ${roundLabel} report uploaded`;
  const text = [
    `Hi ${safeName},`,
    "",
    `Your ${roundLabel} report for ${teamName} was uploaded successfully.`,
    `Version: ${version}`,
    `File: ${fileName}`,
    "",
    "The uploaded report is attached to this confirmation email.",
    "",
    "Attacker 2026",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eff5fb;color:#0f172a;font-family:'Be Vietnam Pro',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff5fb;padding:28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:24px;overflow:hidden;box-shadow:0 22px 54px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:26px 30px;background:linear-gradient(135deg,#0b3158 0%,#1772d0 100%);color:#ffffff;">
                <div style="display:inline-block;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.12);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">Attacker 2026</div>
                <h1 style="margin:18px 0 0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(roundLabel)} report uploaded</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 30px 10px;">
                <p style="margin:0;font-size:16px;line-height:1.8;color:#334155;">Hi ${escapeHtml(safeName)}, your ${escapeHtml(roundLabel)} report for <strong>${escapeHtml(teamName)}</strong> was uploaded successfully.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 30px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid rgba(15,23,42,0.08);border-radius:18px;background:#f8fbff;">
                  <tr>
                    <td style="padding:16px 18px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;font-weight:700;">Version</td>
                    <td style="padding:16px 18px;text-align:right;font-size:15px;color:#0f172a;font-weight:700;">${version}</td>
                  </tr>
                  <tr>
                    <td style="padding:0 18px 16px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;font-weight:700;">File</td>
                    <td style="padding:0 18px 16px;text-align:right;font-size:15px;color:#0f172a;font-weight:700;">${escapeHtml(fileName)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px 30px;">
                <p style="margin:0;font-size:13px;line-height:1.8;color:#64748b;">The uploaded report is attached to this confirmation email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendMail({
    from: ROUND2_UPLOAD_FROM,
    to: teamLeadEmail,
    subject,
    html,
    text,
    attachments: [
      {
        filename: fileName,
        content: fileBuffer,
        contentType: mimeType || "application/octet-stream",
      },
    ],
  });
}

export async function sendRound2SubmissionUploadConfirmation(
  payload: Omit<Parameters<typeof sendTeamSubmissionUploadConfirmation>[0], "roundLabel">,
) {
  return sendTeamSubmissionUploadConfirmation({
    ...payload,
    roundLabel: "Round 2",
  });
}
