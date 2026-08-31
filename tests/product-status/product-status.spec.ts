import { test } from '../../src/fixtures/browser-fixture';

// NOTE: the /Product Status folder has 1 Zephyr case, blocked:
//   - DJCSS-T58: Product Status Page Changes for Product Status, Scheduled Maintenance,
//     and Source Status - validates that numbers are visually centered inside background
//     status icons. This is a pixel-level visual defect check; no distinguishing badge/class
//     was found in the DOM to assert against, so it cannot be verified reliably via the DOM
//     alone and would require visual regression tooling this framework does not have.
test.describe.skip('Product Status - blocked, see NOTE above', () => {});
