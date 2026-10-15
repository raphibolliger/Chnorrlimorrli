export function siteUrl(): string {
  return (Deno.env.get('SITE_URL') ?? 'http://localhost:4200').replace(/\/$/, '');
}

export function envList(name: string): string[] {
  return (Deno.env.get(name) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
