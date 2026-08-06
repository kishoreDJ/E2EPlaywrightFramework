import { test } from '../../src/fixtures/browser-fixture';

// NOTE: the /DJCSS-Admin Page folder has 2 Zephyr cases, both blocked:
//   - DJCSS-T69: Add product to product status page
//   - DJCSS-T70: Remove product from the product status page
// Both require adding/removing a product via the Alfresco CMS admin interface, which this
// framework has no credentials or integration for, and would also mutate shared QA product
// status data used by other tests. Neither is automatable from the DJCSS web app alone.
test.describe.skip('DJCSS-Admin Page - blocked, see NOTE above', () => {});
