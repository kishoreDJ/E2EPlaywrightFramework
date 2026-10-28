/**
 * General-purpose string utility functions for test automation.
 */

/** Replaces all occurrences of `search` with `replacement` in `text`. */
export function replaceText(text: string, search: string, replacement: string): string {
  return text.split(search).join(replacement);
}

/** Returns the character at the given zero-based `index`. */
export function characterAt(text: string, index: number): string {
  return text.charAt(index);
}

/** Returns true if `text` is null, undefined, empty, or contains only whitespace. */
export function isTextBlank(text: string | null | undefined): boolean {
  return text == null || text.trim().length === 0;
}

/** Returns the number of characters in `text`. */
export function getStringLength(text: string): number {
  return text.length;
}

/** Extracts and returns the numeric portion from `text` as a number, or NaN if none found. */
export function getNumberPortion(text: string): number {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : NaN;
}

/** Returns the index of the first occurrence of `substring` in `text`, or -1 if not found. */
export function getFirstOccurrenceIndex(text: string, substring: string): number {
  return text.indexOf(substring);
}

/** Returns the index of the last occurrence of `substring` in `text`, or -1 if not found. */
export function getLastOccurrenceIndex(text: string, substring: string): number {
  return text.lastIndexOf(substring);
}

/** Returns a substring from `start` (inclusive) to `end` (exclusive). Omit `end` to go to end of string. */
export function getSubstring(text: string, start: number, end?: number): string {
  return text.substring(start, end);
}

/** Returns the number of times `substring` appears in `text`. */
export function getSubstringOccurrenceCount(text: string, substring: string): number {
  if (substring.length === 0) return 0;
  return text.split(substring).length - 1;
}
