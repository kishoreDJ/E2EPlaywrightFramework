"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = expect;
exports.allureExpect = expect;
const test_1 = require("@playwright/test");
const allure_playwright_1 = require("allure-playwright");
function buildStepLabel(received, matcherName, expected, negate) {
    const r = formatValue(received);
    const e = formatValue(expected);
    const not = negate ? 'not ' : '';
    const labels = {
        toBe: (r, e) => `Assert ${r} equals ${e}`,
        toEqual: (r, e) => `Assert ${r} deep-equals ${e}`,
        toBeTruthy: (r) => `Assert ${r} is truthy`,
        toBeFalsy: (r) => `Assert ${r} is falsy`,
        toBeNull: (r) => `Assert ${r} is null`,
        toBeUndefined: (r) => `Assert ${r} is undefined`,
        toBeDefined: (r) => `Assert ${r} is defined`,
        toBeGreaterThan: (r, e) => `Assert ${r} > ${e}`,
        toBeGreaterThanOrEqual: (r, e) => `Assert ${r} >= ${e}`,
        toBeLessThan: (r, e) => `Assert ${r} < ${e}`,
        toContain: (r, e) => `Assert ${r} contains ${e}`,
        toHaveLength: (r, e) => `Assert length of ${r} is ${e}`,
        toMatch: (r, e) => `Assert ${r} matches ${e}`,
    };
    const fn = labels[matcherName];
    const base = fn ? fn(r, e) : `Assert ${matcherName}(${r}, ${e})`;
    return not ? base.replace('Assert ', 'Assert not ') : base;
}
function formatValue(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'string')
        return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (Array.isArray(value))
        return `[array(${value.length})]`;
    if (typeof value === 'object')
        return '{object}';
    return String(value);
}
function wrapMatcher(received, matcher, negate) {
    return new Proxy(matcher, {
        get(target, prop) {
            // Prevent recursive wrapping of 'not'
            if (prop === 'not') {
                const baseNot = target['not'];
                if (!baseNot)
                    return undefined;
                return wrapMatcher(received, baseNot, !negate);
            }
            const original = target[prop];
            if (typeof original !== 'function')
                return original;
            return (...args) => {
                const label = buildStepLabel(received, prop, args[0], negate);
                return allure_playwright_1.allure.step(label, () => original.apply(target, args));
            };
        },
    });
}
function expect(received, message) {
    const base = (0, test_1.expect)(received, message ? { message } : undefined);
    return wrapMatcher(received, base, false);
}
