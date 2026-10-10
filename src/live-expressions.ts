export type ExpressionValue = string | number | null;
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
export function expressionReplacement(
  keyword: string,
  dynamic: boolean,
  value: ExpressionValue,
): string | null {
  if (value === null) return null;
  return dynamic
    ? `<span class="persian-dynamic-tag" data-key="${escapeHtml(keyword)}">${escapeHtml(String(value))}</span>`
    : String(value);
}
export function refreshLiveExpressions(
  root: ParentNode,
  calculate: (keyword: string) => ExpressionValue,
): number {
  let changed = 0;
  root
    .querySelectorAll<HTMLElement>("span.persian-dynamic-tag")
    .forEach((tag) => {
      const value = calculate(tag.dataset.key ?? "");
      if (value !== null && tag.textContent !== String(value)) {
        tag.textContent = String(value);
        changed++;
      }
    });
  return changed;
}
