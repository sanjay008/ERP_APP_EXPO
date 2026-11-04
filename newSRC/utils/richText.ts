/** True when a pell-rich-editor value has no visible text. Keeps `<p></p>` from passing required checks. */
export function isRichTextEmpty(value?: string | null) {
  if (!value) return true;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/** Send the editor HTML as-is so existing comment and description APIs stay compatible. */
export function richTextPayload(value: string) {
  return value.trim();
}
