import { test as base } from '@playwright/test';
import { RestConnection } from '../api/rest/connection/rest-connection';
import { BaseRestClient } from '../api/rest/client/base-rest-client';

type RestClientFixture = {
  restClient: BaseRestClient;
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
});

export { expect } from '@playwright/test';