function allowedOrigins(): string[] {
  const siteUrl = Deno.env.get('SITE_URL');
  const extra = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...(siteUrl ? [new URL(siteUrl).origin] : []), ...extra, 'http://localhost:4200'];
}

export function isAllowedOrigin(origin: string | null): origin is string {
  return origin !== null && allowedOrigins().includes(origin);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

export function returnBaseUrl(candidate: unknown): string {
  const fallback = (Deno.env.get('SITE_URL') ?? 'http://localhost:4200').replace(/\/$/, '');
  if (typeof candidate !== 'string') {
    return fallback;
  }
  try {
    const url = new URL(candidate);
    return isAllowedOrigin(url.origin)
      ? `${url.origin}${url.pathname}`.replace(/\/$/, '')
      : fallback;
  } catch {
    return fallback;
  }
}
