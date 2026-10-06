/**
 * Collision-safe value generators for parallel test runs.
 * Avoids hardcoded literals (codePrefix, orderNumber, emails) colliding
 * across the 50+ concurrent tests the browser/REST fixtures are built for.
 */

import { randomUUID } from 'crypto';

/**
 * Short unique suffix safe for fields with length limits (e.g. codePrefix <= 10 chars).
 */
export function uniqueSuffix(length: number = 6): string {
  return randomUUID().replace(/-/g, '').slice(0, length);
}

export function uniqueEmail(domain: string = 'example.com'): string {
  return `qa.${uniqueSuffix(10)}@${domain}`;
}

export function uniqueOrderNumber(prefix: string = 'o'): string {
  return `${prefix}${uniqueSuffix(9)}`;
}

export function uniqueCodePrefix(prefix: string = 'PRF'): string {
  // codePrefix cannot exceed 10 characters
  return `${prefix}${uniqueSuffix(10 - prefix.length)}`.slice(0, 10);
}
