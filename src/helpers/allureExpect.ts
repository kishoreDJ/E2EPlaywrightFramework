import { expect as baseExpect } from '@playwright/test';
import { allure } from 'allure-playwright';

function buildStepLabel(received: unknown, matcherName: string, expected: unknown, negate: boolean): string {
  const r = formatValue(received);
  const e = formatValue(expected);
  const not = negate ? 'not ' : '';

  const labels: Record<string, (r: string, e: string) => string> = {
    toBe:                   (r, e) => `Assert ${r} equals ${e}`,
    toEqual:                (r, e) => `Assert ${r} deep-equals ${e}`,
    toBeTruthy:             (r)    => `Assert ${r} is truthy`,
    toBeFalsy:              (r)    => `Assert ${r} is falsy`,
    toBeNull:               (r)    => `Assert ${r} is null`,
    toBeUndefined:          (r)    => `Assert ${r} is undefined`,
    toBeDefined:            (r)    => `Assert ${r} is defined`,
    toBeGreaterThan:        (r, e) => `Assert ${r} > ${e}`,
    toBeGreaterThanOrEqual: (r, e) => `Assert ${r} >= ${e}`,
    toBeLessThan:           (r, e) => `Assert ${r} < ${e}`,
    toContain:              (r, e) => `Assert ${r} contains ${e}`,
    toHaveLength:           (r, e) => `Assert length of ${r} is ${e}`,
    toMatch:                (r, e) => `Assert ${r} matches ${e}`,
  };

  const fn = labels[matcherName];
  const base = fn ? fn(r, e) : `Assert ${matcherName}(${r}, ${e})`;
  return not ? base.replace('Assert ', 'Assert not ') : base;
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[array(${value.length})]`;
  if (typeof value === 'object') return '{object}';
  return String(value);
}

function wrapMatcher(received: unknown, matcher: object, negate: boolean): object {
  return new Proxy(matcher, {
    get(target, prop: string) {
      // Prevent recursive wrapping of 'not'
      if (prop === 'not') {
        const baseNot = (target as Record<string, unknown>)['not'];
        if (!baseNot) return undefined;
        return wrapMatcher(received, baseNot as object, !negate);
      }

      const original = (target as unknown as Record<string, unknown>)[prop];
      if (typeof original !== 'function') return original;

      return (...args: unknown[]) => {
        const label = buildStepLabel(received, prop, args[0], negate);
        return (allure.step as (name: string, body: () => unknown) => unknown)(
          label,
          () => (original as (...a: unknown[]) => unknown).apply(target, args),
        );
      };
    },
  });
}

export function expect(received: unknown, message?: string) {
  const base = baseExpect(received, message ? { message } : undefined);
  return wrapMatcher(received, base, false) as ReturnType<typeof baseExpect>;
}

export { expect as allureExpect };
