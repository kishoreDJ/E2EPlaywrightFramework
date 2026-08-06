import { test } from '../../src/fixtures/browser-fixture';

// NOTE: the /Scheduled Maintenance folder has 3 Zephyr cases, all blocked:
//   - DJCSS-T122: Verify Updated Factiva Scheduled Maintenance Notification Email
//   - DJCSS-T123: Verify Updated Newswires Scheduled Maintenance Notification Email
//   - DJCSS-T124: Verify Updated Risk and Compliance Scheduled Maintenance Notification Email
// All 3 require triggering a scheduled maintenance notification email (published via
// Alfresco CMS) and inspecting the resulting email template/logo via Campaign Monitor -
// external systems this framework has no credentials or integration for. None are
// automatable from the DJCSS web app alone.
test.describe.skip('Scheduled Maintenance - blocked, see NOTE above', () => {});
