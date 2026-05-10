import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
};

type MailSendResult = {
  mode: "smtp" | "log" | "error";
  error?: string;
};

let cachedTransporter: nodemailer.Transporter | null | undefined;

function readConfigValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function getMailHost() {
  return readConfigValue("SMTP_HOST", "MAIL_HOST");
}

function getMailPort() {
  return readConfigValue("SMTP_PORT", "MAIL_PORT");
}

function getMailUser() {
  return readConfigValue("SMTP_USER", "MAIL_USERNAME");
}

function getMailPassword() {
  return readConfigValue("SMTP_PASSWORD", "MAIL_PASSWORD");
}

function getMailFrom() {
  const explicit = readConfigValue("SMTP_FROM");
  if (explicit) {
    if (explicit.includes("@") || explicit.includes("<")) {
      return explicit;
    }

    const mailUser = getMailUser();
    if (mailUser) {
      return `${explicit} <${mailUser}>`;
    }

    return explicit;
  }

  const fromAddress = readConfigValue("MAIL_FROM_ADDRESS");
  if (!fromAddress) {
    return "";
  }

  const fromName = readConfigValue("MAIL_FROM_NAME");
  return fromName ? `${fromName} <${fromAddress}>` : fromAddress;
}

function getMailSecure() {
  const smtpSecure = process.env.SMTP_SECURE?.trim();
  if (smtpSecure === "true") {
    return true;
  }
  if (smtpSecure === "false") {
    return false;
  }

  const mailEncryption = process.env.MAIL_ENCRYPTION?.trim().toLowerCase();
  if (mailEncryption === "ssl") {
    return true;
  }
  if (mailEncryption === "tls" || mailEncryption === "starttls") {
    return false;
  }

  return Number(getMailPort()) === 465;
}

function hasMailConfiguration() {
  return Boolean(
    getMailHost() &&
      getMailPort() &&
      getMailFrom() &&
      getMailUser() &&
      getMailPassword(),
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
    host: getMailHost(),
    port: Number(getMailPort()),
    secure: getMailSecure(),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: getMailUser(),
      pass: getMailPassword(),
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

  try {
    await transporter.sendMail({
      from: payload.from ?? getMailFrom(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments,
    });

    return { mode: "smtp" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    console.error("[mail][smtp-error]", {
      to: payload.to,
      subject: payload.subject,
      message,
    });
    return {
      mode: "error",
      error: message,
    };
  }
}
