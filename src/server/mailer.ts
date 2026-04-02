import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type MailSendResult = {
  mode: "smtp" | "log";
};

let cachedTransporter: nodemailer.Transporter | null | undefined;

function hasMailConfiguration() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_FROM &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  );
}

function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  if (!hasMailConfiguration()) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return cachedTransporter;
}

export async function sendMail(payload: MailPayload): Promise<MailSendResult> {
  const transporter = getTransporter();

  if (!transporter) {
    console.info("[mail][log-only]", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return { mode: "log" };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return { mode: "smtp" };
}
