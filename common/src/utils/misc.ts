export function strokeColor(color: string): string {
  const s =
      (c:number) => Math.round(parseInt(color.slice(c * 2 + 1, c * 2 + 3), 16) * 0.81).toString(16).padStart(2, "0");
  return "#" + s(0) + s(1) + s(2);
}
