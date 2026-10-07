import { test as base } from '@playwright/test';
import { RestConnection } from '../api/rest/connection/rest-connection';
import { BaseRestClient } from '../api/rest/client/base-rest-client';
import { apiClient } from '../helpers/apiClient';

type RestClientFixture = {
  restClient: BaseRestClient;
  api: ReturnType<typeof apiClient>;
};

export const test = base.extend<RestClientFixture>({
  restClient: async ({ request }, use) => {
    const connection = new RestConnection(request, {
      baseUrl: process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const client = new BaseRestClient(connection);
    await use(client);
  },

  // Allure-instrumented API client — use { api } in tests instead of { request }
  api: async ({ request }, use) => {
    await use(apiClient(request));
  },
});

export { expect } from '@playwright/test';