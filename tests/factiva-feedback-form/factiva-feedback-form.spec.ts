import { test } from '../../src/fixtures/browser-fixture';

// NOTE: the /Factiva Feedback Form folder has 1 Zephyr case, blocked/defect:
//   - DJCSS-T126: Verify Unrestricted Upload of File for Factiva Feedback form
// Investigation of this QA build's Contact Us menu found no "Factiva Feedback" form page
// in the DJCSS app at all - the top-nav "FEEDBACK" link opens an external Zoho survey
// (https://survey.zohopublic.com/zs/OfRXAF) in a new tab, not an in-app form with a file
// upload field. This case cannot be automated against this build and is documented here as
// a likely product defect / stale test case rather than a false pass.
test.describe.skip('Factiva Feedback Form - blocked, see NOTE above', () => {});
