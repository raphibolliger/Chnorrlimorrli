export function francsInput(rappen: number): string {
  return (rappen / 100).toFixed(2);
}

export function parseFrancs(value: string): number | null {
  const francs = Number(value.replace(',', '.'));
  return Number.isFinite(francs) && francs >= 0 ? Math.round(francs * 100) : null;
}
