"use strict";
/**
 * General-purpose string utility functions for test automation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceText = replaceText;
exports.characterAt = characterAt;
exports.isTextBlank = isTextBlank;
exports.getStringLength = getStringLength;
exports.getNumberPortion = getNumberPortion;
exports.getFirstOccurrenceIndex = getFirstOccurrenceIndex;
exports.getLastOccurrenceIndex = getLastOccurrenceIndex;
exports.getSubstring = getSubstring;
exports.getSubstringOccurrenceCount = getSubstringOccurrenceCount;
/** Replaces all occurrences of `search` with `replacement` in `text`. */
function replaceText(text, search, replacement) {
    return text.split(search).join(replacement);
}
/** Returns the character at the given zero-based `index`. */
function characterAt(text, index) {
    return text.charAt(index);
}
/** Returns true if `text` is null, undefined, empty, or contains only whitespace. */
function isTextBlank(text) {
    return text == null || text.trim().length === 0;
}
/** Returns the number of characters in `text`. */
function getStringLength(text) {
    return text.length;
}
/** Extracts and returns the numeric portion from `text` as a number, or NaN if none found. */
function getNumberPortion(text) {
    const match = text.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : NaN;
}
/** Returns the index of the first occurrence of `substring` in `text`, or -1 if not found. */
function getFirstOccurrenceIndex(text, substring) {
    return text.indexOf(substring);
}
/** Returns the index of the last occurrence of `substring` in `text`, or -1 if not found. */
function getLastOccurrenceIndex(text, substring) {
    return text.lastIndexOf(substring);
}
/** Returns a substring from `start` (inclusive) to `end` (exclusive). Omit `end` to go to end of string. */
function getSubstring(text, start, end) {
    return text.substring(start, end);
}
/** Returns the number of times `substring` appears in `text`. */
function getSubstringOccurrenceCount(text, substring) {
    if (substring.length === 0)
        return 0;
    return text.split(substring).length - 1;
}
