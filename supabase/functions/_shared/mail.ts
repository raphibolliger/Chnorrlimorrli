export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailSettings {
  connectionString: string;
  from: string;
  replyTo?: string;
  redirectTo?: string;
}

export interface AcsCredentials {
  endpoint: string;
  accessKey: string;
}

export function mailSettingsFromEnv(): MailSettings {
  const connectionString = Deno.env.get('ACS_CONNECTION_STRING');
  if (!connectionString) {
    throw new Error('ACS_CONNECTION_STRING is not configured');
  }
  return {
    connectionString,
    from: Deno.env.get('MAIL_FROM') ?? 'noreply@chnorrlimorrli.ch',
    replyTo: Deno.env.get('MAIL_REPLY_TO') || undefined,
    redirectTo: Deno.env.get('MAIL_REDIRECT_TO') || undefined,
  };
}

export function parseConnectionString(connectionString: string): AcsCredentials {
  const parts = Object.fromEntries(
    connectionString
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        return [part.slice(0, separator).toLowerCase(), part.slice(separator + 1)];
      }),
  );
  if (!parts.endpoint || !parts.accesskey) {
    throw new Error('ACS connection string needs endpoint and accesskey');
  }
  return { endpoint: parts.endpoint.replace(/\/$/, ''), accessKey: parts.accesskey };
}

export function applyRedirect(message: MailMessage, redirectTo: string | undefined): MailMessage {
  if (!redirectTo) {
    return message;
  }
  return { ...message, to: redirectTo, subject: `[an ${message.to}] ${message.subject}` };
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function signRequest(
  credentials: AcsCredentials,
  pathAndQuery: string,
  body: string,
  date: string,
): Promise<Record<string, string>> {
  const host = new URL(credentials.endpoint).host;
  const contentHash = toBase64(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    fromBase64(credentials.accessKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const stringToSign = `POST\n${pathAndQuery}\n${date};${host};${contentHash}`;
  const signature = toBase64(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(stringToSign)),
  );
  return {
    'x-ms-date': date,
    'x-ms-content-sha256': contentHash,
    Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
  };
}

export async function sendMail(message: MailMessage, settings: MailSettings): Promise<void> {
  const credentials = parseConnectionString(settings.connectionString);
  const delivered = applyRedirect(message, settings.redirectTo);
  const pathAndQuery = '/emails:send?api-version=2023-03-31';
  const body = JSON.stringify({
    senderAddress: settings.from,
    recipients: { to: [{ address: delivered.to }] },
    content: { subject: delivered.subject, plainText: delivered.text, html: delivered.html },
    replyTo: settings.replyTo ? [{ address: settings.replyTo }] : undefined,
    userEngagementTrackingDisabled: true,
  });
  const headers = await signRequest(credentials, pathAndQuery, body, new Date().toUTCString());
  const response = await fetch(`${credentials.endpoint}${pathAndQuery}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body,
  });
  if (response.status !== 202) {
    throw new Error(`ACS rejected the mail with HTTP ${response.status}: ${await response.text()}`);
  }
}
