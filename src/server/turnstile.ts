const TURNSTILE_SITEVERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Official Cloudflare Turnstile test credentials. Replace these with real keys later.
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

type TurnstileValidationResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_TEST_SITE_KEY;
}

function getTurnstileSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || TURNSTILE_TEST_SECRET_KEY;
}

export async function verifyTurnstileToken({
  token,
  action,
  remoteIp,
}: {
  token: string;
  action?: string;
  remoteIp?: string;
}) {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return {
      success: false,
      errorCodes: ["missing-input-response"],
    };
  }

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: getTurnstileSecretKey(),
        response: trimmedToken,
        remoteip: remoteIp,
        idempotency_key: crypto.randomUUID(),
      }),
    });

    const payload = (await response.json().catch(() => null)) as TurnstileValidationResponse | null;
    if (!response.ok || !payload) {
      return {
        success: false,
        errorCodes: ["internal-error"],
      };
    }

    if (!payload.success) {
      return {
        success: false,
        errorCodes: payload["error-codes"] ?? ["invalid-input-response"],
      };
    }

    if (action && payload.action && payload.action !== action) {
      return {
        success: false,
        errorCodes: ["action-mismatch"],
      };
    }

    return {
      success: true,
      errorCodes: [] as string[],
    };
  } catch {
    return {
      success: false,
      errorCodes: ["internal-error"],
    };
  }
}
