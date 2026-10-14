import { BaseRestClient } from '../api/rest/client/base-rest-client';
import { apiClient } from '../helpers/apiClient';
type RestClientFixture = {
    restClient: BaseRestClient;
    api: ReturnType<typeof apiClient>;
};
export declare const test: import("playwright/test").TestType<import("playwright/test").PlaywrightTestArgs & import("playwright/test").PlaywrightTestOptions & RestClientFixture, import("playwright/test").PlaywrightWorkerArgs & import("playwright/test").PlaywrightWorkerOptions>;
export { expect } from '@playwright/test';
//# sourceMappingURL=rest-client.fixture.d.ts.map