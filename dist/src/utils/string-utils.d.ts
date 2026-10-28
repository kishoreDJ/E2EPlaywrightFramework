/**
 * General-purpose string utility functions for test automation.
 */
/** Replaces all occurrences of `search` with `replacement` in `text`. */
export declare function replaceText(text: string, search: string, replacement: string): string;
/** Returns the character at the given zero-based `index`. */
export declare function characterAt(text: string, index: number): string;
/** Returns true if `text` is null, undefined, empty, or contains only whitespace. */
export declare function isTextBlank(text: string | null | undefined): boolean;
/** Returns the number of characters in `text`. */
export declare function getStringLength(text: string): number;
/** Extracts and returns the numeric portion from `text` as a number, or NaN if none found. */
export declare function getNumberPortion(text: string): number;
/** Returns the index of the first occurrence of `substring` in `text`, or -1 if not found. */
export declare function getFirstOccurrenceIndex(text: string, substring: string): number;
/** Returns the index of the last occurrence of `substring` in `text`, or -1 if not found. */
export declare function getLastOccurrenceIndex(text: string, substring: string): number;
/** Returns a substring from `start` (inclusive) to `end` (exclusive). Omit `end` to go to end of string. */
export declare function getSubstring(text: string, start: number, end?: number): string;
/** Returns the number of times `substring` appears in `text`. */
export declare function getSubstringOccurrenceCount(text: string, substring: string): number;
//# sourceMappingURL=string-utils.d.ts.map