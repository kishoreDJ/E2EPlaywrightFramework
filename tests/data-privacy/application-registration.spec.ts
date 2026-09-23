import { test, expect } from '../../src/fixtures/rest-client.fixture';
import { getBearerHeader } from '../../src/helpers/authHelper';
import { getStandardHeaders, getDeleteHeaders } from '../../src/helpers/requestHeaders';
import { query, closeDb } from '../../src/helpers/dbHelper';
import { allure } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_PATH = '/api/v1/customer-data-privacy/application/registration/';
const DELETE_PATH = '/api/v1/customer-data-privacy/application/';
const CREATED_BY = 'api-automation';
const VALID_CATEGORIES = ['B2C', 'B2B_CIBS', 'B2B_PALM', 'B2B_OASYS'];

// Helper to attach any data to Allure
async function attachToAllure(label: string, data: unknown) {
  await allure.attachment(label, JSON.stringify(data, null, 2), 'application/json');
}

// Helper to run a DB query and attach both the SQL and result to Allure
async function queryWithAttach<T = Record<string, unknown>>(
  label: string,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  await allure.attachment(`DB Query - ${label}`, JSON.stringify({ sql: sql.trim(), params }, null, 2), 'application/json');
  const result = await query<T>(sql, params);
  await allure.attachment(`DB Result - ${label}`, JSON.stringify(result, null, 2), 'application/json');
  return result;
}

// Helper to read is_active BIT value from MySQL
function readBitValue(val: unknown): number {
  if (Buffer.isBuffer(val)) return val[0];
  if (val && typeof val === 'object' && 'data' in val) return (val as any).data[0];
  return Number(val);
}

// Helper to check datetime is recent — compares against DB server time to avoid timezone issues
async function isRecent(dateVal: string | Date): Promise<boolean> {
  const dbNow = await query<{ now: string | Date }>('SELECT NOW() as now');
  const serverNow = dbNow[0].now instanceof Date ? dbNow[0].now : new Date(dbNow[0].now);
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  const diff = Math.abs(serverNow.getTime() - date.getTime());
  return diff < 300_000; // within 5 minutes of DB server time
}

// Generate unique applicationId per run to avoid duplicates
function generateAppId(): string {
  return `TEST_AUTO_${Date.now()}`;
}

// Create app, verify in DB, run test logic, then delete and verify removed
async function withTestApp(
  restClient: any,
  token: string,
  appId: string,
  requestBody: object,
  testFn: () => Promise<void>
): Promise<void> {
  // Create
  const createResponse = await restClient.post(BASE_PATH, requestBody, {
    headers: getStandardHeaders(token),
  });
  expect(createResponse.statusCode, `Failed to create app ${appId}`).toBe(201);

  // Verify created in DB
  const dbAfterCreate = await query<{ application_id: string }>(`
    SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
    WHERE application_id = ? LIMIT 1
  `, [appId]);
  expect(dbAfterCreate.length, `App ${appId} not found in DB after creation`).toBe(1);

  try {
    await testFn();
  } finally {
    // Always delete — even if test fails
    await restClient.delete(`${DELETE_PATH}${appId}`, {
      headers: getDeleteHeaders(token),
    });

    // Verify removed from DB
    const dbAfterDelete = await query<{ application_id: string }>(`
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
      WHERE application_id = ? LIMIT 1
    `, [appId]);
    expect(dbAfterDelete.length, `App ${appId} should be removed from DB after deletion`).toBe(0);
  }
}

test.afterAll(async () => {
  await closeDb();
});

// ============================================================
// GET /api/v1/customer-data-privacy/application/registration/
// ============================================================

test.describe('GET /registration/', () => {

  test('@smoke GET - default pagination returns list with correct structure', async ({ restClient }) => {
    const token = await getBearerHeader();
    const headers = getStandardHeaders(token);

    await attachToAllure('Request Headers', headers);

    const response = await restClient.get(BASE_PATH, { headers });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.type).toBeDefined();
    expect(body.data.attributes.payload.dataPrivacyRegistration).toBeInstanceOf(Array);
    expect(body.data.attributes.payload.dataPrivacyRegistration.length).toBeGreaterThan(0);
    expect(body.data.attributes.payload.totalPages).toBeGreaterThan(0);
    expect(body.data.attributes.payload.currentPage).toBe(1);
  });

  test('@regression GET - verify all response fields exist and are not null', async ({ restClient }) => {
    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { page: 1, size: 5 },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(200);
    const registrations = body.data.attributes.payload.dataPrivacyRegistration;
    expect(registrations.length).toBeGreaterThan(0);

    for (const reg of registrations) {
      expect(reg.applicationId, 'applicationId should not be null').toBeTruthy();
      expect(reg.applicationName, 'applicationName should not be null').toBeTruthy();
      expect(reg.supportEmail, 'supportEmail should not be null').toBeTruthy();
      expect(reg.applicationCategory, 'applicationCategory should be an array').toBeInstanceOf(Array);
      for (const cat of reg.applicationCategory) {
        expect(VALID_CATEGORIES, `Invalid category: ${cat}`).toContain(cat);
      }
      expect(reg.status, 'status should not be null').toBeTruthy();
      expect(reg.createdBy, 'createdBy should not be null').toBeTruthy();
      expect(reg.createdAt, 'createdAt should not be null').toBeTruthy();
    }
  });

  test('@regression GET - verify page size filter', async ({ restClient }) => {
    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { page: 1, size: 5 },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(200);
    expect(body.data.attributes.payload.dataPrivacyRegistration.length).toBeLessThanOrEqual(5);
    expect(body.data.attributes.payload.currentPage).toBe(1);
  });

  test('@regression GET - filter by applicationId and verify DB', async ({ restClient }) => {
    // Pick a random active app from DB
    const dbApps = await queryWithAttach<{ application_id: string }>('Random active app', `
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
      WHERE is_active = 1 ORDER BY RAND() LIMIT 1
    `);
    expect(dbApps.length).toBeGreaterThan(0);
    const appId = dbApps[0].application_id;

    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { applicationId: appId },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(200);
    const registrations = body.data.attributes.payload.dataPrivacyRegistration;
    expect(registrations.length).toBeGreaterThan(0);
    registrations.forEach((reg: any) => {
      expect(reg.applicationId).toBe(appId);
    });
  });

  test('@regression GET - filter by applicationName and verify DB', async ({ restClient }) => {
    const dbApps = await query<{ application_name: string }>(`
      SELECT application_name FROM custpiidatadeletion.data_privacy_app_registry
      WHERE is_active = 1 AND application_name IS NOT NULL ORDER BY RAND() LIMIT 1
    `);
    expect(dbApps.length).toBeGreaterThan(0);
    const appName = dbApps[0].application_name;

    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { applicationName: appName },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(200);
    const registrations = body.data.attributes.payload.dataPrivacyRegistration;
    expect(registrations.length).toBeGreaterThan(0);
    expect(registrations[0].applicationName).toBe(appName);
  });

  test('@regression GET - verify all fields match DB for each record', async ({ restClient }) => {
    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { page: 1, size: 10 },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);
    expect(response.statusCode).toBe(200);

    const apiRegistrations = body.data.attributes.payload.dataPrivacyRegistration;

    for (const apiReg of apiRegistrations) {
      const dbResult = await query<{
        application_id: string;
        application_name: string;
        support_email: string;
        is_active: unknown;
        created_by: string;
        created_at: string;
      }>(`
        SELECT application_id, application_name, support_email, is_active, created_by, created_at
        FROM custpiidatadeletion.data_privacy_app_registry
        WHERE application_id = ? LIMIT 1
      `, [apiReg.applicationId]);

      expect(dbResult.length, `${apiReg.applicationId} not found in DB`).toBeGreaterThan(0);
      const db = dbResult[0];

      expect(db.application_name).toBe(apiReg.applicationName);
      expect(db.support_email).toBe(apiReg.supportEmail);
      expect(db.created_by).toBe(apiReg.createdBy);

      const isActiveVal = readBitValue(db.is_active);
      const expectedActive = apiReg.status === 'Active' ? 1 : 0;
      expect(isActiveVal, `Status mismatch for ${apiReg.applicationId}`).toBe(expectedActive);

      // Verify applicationCategory from multi_category table
      const dbCategories = await query<{ application_category: string }>(`
        SELECT mc.application_category
        FROM custpiidatadeletion.data_privacy_app_registry_multi_category mc
        JOIN custpiidatadeletion.data_privacy_app_registry r ON mc.app_registry_id = r.id
        WHERE r.application_id = ?
      `, [apiReg.applicationId]);

      const dbCategoryValues = dbCategories.map(c => c.application_category);
      for (const cat of apiReg.applicationCategory) {
        expect(dbCategoryValues, `Category ${cat} missing in DB for ${apiReg.applicationId}`).toContain(cat);
      }
    }

    // Save test data
    fs.writeFileSync(
      path.join(process.cwd(), 'test-data.md'),
      `# GET Registration Test Data\n\n\`\`\`json\n${JSON.stringify(apiRegistrations, null, 2)}\n\`\`\`\n`
    );
  });

  test('@regression GET - non-existent applicationId returns 404', async ({ restClient }) => {
    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { applicationId: 'NON_EXISTENT_APP_XYZ_999' },
    });
    const body = await response.json();

    await attachToAllure('Response Body', body);

    expect(response.statusCode).toBe(404);
    expect(body.error).toBeDefined();
    expect(body.error.attributes.payload.errorMessage).toBe('No customer data found.');
  });

  test('@regression GET - returns 401 with invalid token', async ({ restClient }) => {
    const response = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders('Bearer invalid-token'),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(401);
  });

  test('@regression GET - returns 400 when required headers are missing', async ({ restClient }) => {
    const token = await getBearerHeader();
    const response = await restClient.get(BASE_PATH, {
      headers: { Authorization: token },
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

});

// ============================================================
// POST /api/v1/customer-data-privacy/application/registration/
// ============================================================

test.describe('POST /registration/', () => {

  test('@smoke POST - create new application, verify in DB, then delete and verify removed', async ({ restClient }) => {
    const appId = generateAppId();
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: appId,
            applicationName: 'Test Automation App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body', requestBody);

    await withTestApp(restClient, token, appId, requestBody, async () => {
      // Re-call POST to get response body for assertions (withTestApp already created it)
      // So instead fetch from GET to verify response fields
      const getResponse = await restClient.get(BASE_PATH, {
        headers: getStandardHeaders(token),
        queryParams: { applicationId: appId },
      });
      const body = await getResponse.json();
      await attachToAllure('Response Body', body);

      const reg = body.data.attributes.payload.dataPrivacyRegistration[0];
      expect(reg.applicationId).toBe(appId);
      expect(reg.applicationName).toBe('Test Automation App');
      expect(reg.supportEmail).toBe('api-automation@dowjones.com');
      expect(reg.status).toBe('Active');
      expect(reg.createdBy).toBe(CREATED_BY);
      expect(reg.createdAt).toBeTruthy();

      // Verify in DB
      const dbResult = await query<{
        application_id: string;
        application_name: string;
        support_email: string;
        is_active: unknown;
        created_by: string;
        created_at: string;
      }>(`
        SELECT application_id, application_name, support_email, is_active, created_by, created_at
        FROM custpiidatadeletion.data_privacy_app_registry
        WHERE application_id = ? LIMIT 1
      `, [appId]);

      const db = dbResult[0];
      expect(db.application_name).toBe('Test Automation App');
      expect(db.support_email).toBe('api-automation@dowjones.com');
      expect(db.created_by).toBe(CREATED_BY);
      expect(readBitValue(db.is_active)).toBe(1);
      expect(await isRecent(db.created_at), 'created_at should be recent').toBe(true);

      // Verify categories in multi_category table
      const dbCategories = await query<{ application_category: string }>(`
        SELECT mc.application_category
        FROM custpiidatadeletion.data_privacy_app_registry_multi_category mc
        JOIN custpiidatadeletion.data_privacy_app_registry r ON mc.app_registry_id = r.id
        WHERE r.application_id = ?
      `, [appId]);

      expect(dbCategories.length).toBeGreaterThan(0);
      expect(dbCategories.map(c => c.application_category)).toContain('B2C');

      fs.writeFileSync(
        path.join(process.cwd(), 'test-data.md'),
        `# POST Registration Test Data\n\nCreated applicationId: ${appId}\n\n\`\`\`json\n${JSON.stringify(reg, null, 2)}\n\`\`\`\n`
      );
    });
  });

  test('@regression POST - created application appears in GET list, then delete and verify removed', async ({ restClient }) => {
    const appId = generateAppId();
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: appId,
            applicationName: 'Test Get Verify App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body (POST)', requestBody);

    await withTestApp(restClient, token, appId, requestBody, async () => {
      const getResponse = await restClient.get(BASE_PATH, {
        headers: getStandardHeaders(token),
        queryParams: { applicationId: appId },
      });
      const getBody = await getResponse.json();
      await attachToAllure('GET Response Body', getBody);

      expect(getResponse.statusCode).toBe(200);
      const registrations = getBody.data.attributes.payload.dataPrivacyRegistration;
      expect(registrations.length).toBeGreaterThan(0);
      expect(registrations[0].applicationId).toBe(appId);
    });
  });

  test('@regression POST - missing required field applicationId returns 400', async ({ restClient }) => {
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationName: 'Missing ID App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

  test('@regression POST - missing required field supportEmail returns 400', async ({ restClient }) => {
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: generateAppId(),
            applicationName: 'Missing Email App',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

  test('@regression POST - invalid email format returns 400', async ({ restClient }) => {
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: generateAppId(),
            applicationName: 'Invalid Email App',
            supportEmail: 'not-an-email',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

  test('@regression POST - duplicate applicationId returns 409', async ({ restClient }) => {
    // Use an existing applicationId from DB
    const dbApps = await query<{ application_id: string }>(`
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
      WHERE is_active = 1 ORDER BY RAND() LIMIT 1
    `);
    expect(dbApps.length).toBeGreaterThan(0);
    const existingId = dbApps[0].application_id;

    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: existingId,
            applicationName: 'Duplicate App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();
    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(409);
  });

  test('@regression POST - returns 401 with invalid token', async ({ restClient }) => {
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: generateAppId(),
            applicationName: 'Auth Test App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: getStandardHeaders('Bearer invalid-token'),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(401);
  });

  test('@regression POST - returns 400 when required headers are missing', async ({ restClient }) => {
    const token = await getBearerHeader();
    const requestBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: generateAppId(),
            applicationName: 'Missing Headers App',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    await attachToAllure('Request Body', requestBody);

    const response = await restClient.post(BASE_PATH, requestBody, {
      headers: { Authorization: token },
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

});

// ============================================================
// PUT /api/v1/customer-data-privacy/application/registration/{applicationId}
// ============================================================

test.describe('PUT /registration/{applicationId}', () => {

  test('@smoke PUT - update application, verify in DB, then delete and verify removed', async ({ restClient }) => {
    const appId = generateAppId();
    const createBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: appId,
            applicationName: 'App Before Update',
            supportEmail: 'before-update@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    const token = await getBearerHeader();

    await withTestApp(restClient, token, appId, createBody, async () => {
      await new Promise(r => setTimeout(r, 1000));

      const updatedAt = new Date().toISOString();
      const updateBody = {
        data: {
          type: 'customer-data-privacy',
          attributes: {
            payload: {
              applicationName: 'App After Update',
              supportEmail: 'after-update@dowjones.com',
              applicationCategory: ['B2C', 'B2B_CIBS'],
              status: 'Active',
              updatedBy: CREATED_BY,
              updatedAt,
            },
          },
        },
      };

      await attachToAllure('Request Body (PUT)', updateBody);

      const putResponse = await restClient.put(`${BASE_PATH}${appId}`, updateBody, {
        headers: getStandardHeaders(token),
      });
      const putBody = await putResponse.json();

      await attachToAllure('Response Body (PUT)', putBody);

      expect(putResponse.statusCode).toBe(200);
      expect(putBody.data.attributes.payload.applicationId).toBe(appId);
      expect(putBody.data.attributes.payload.applicationName).toBe('App After Update');
      expect(putBody.data.attributes.payload.supportEmail).toBe('after-update@dowjones.com');
      expect(putBody.data.attributes.payload.updatedBy).toBe(CREATED_BY);

      // Verify updated values in DB
      const dbResult = await query<{
        application_name: string;
        support_email: string;
        updated_by: string;
        updated_at: string;
        created_at: string;
      }>(`
        SELECT application_name, support_email, updated_by, updated_at, created_at
        FROM custpiidatadeletion.data_privacy_app_registry
        WHERE application_id = ? LIMIT 1
      `, [appId]);

      const db = dbResult[0];
      expect(db.application_name).toBe('App After Update');
      expect(db.support_email).toBe('after-update@dowjones.com');
      expect(db.updated_by).toBe(CREATED_BY);
      expect(await isRecent(db.updated_at), 'updated_at should be recent after update').toBe(true);
      expect(db.created_at).toBeTruthy();

      const dbCategories = await query<{ application_category: string }>(`
        SELECT mc.application_category
        FROM custpiidatadeletion.data_privacy_app_registry_multi_category mc
        JOIN custpiidatadeletion.data_privacy_app_registry r ON mc.app_registry_id = r.id
        WHERE r.application_id = ?
      `, [appId]);

      const cats = dbCategories.map(c => c.application_category);
      expect(cats).toContain('B2C');
      expect(cats).toContain('B2B_CIBS');
    });
  });

  test('@regression PUT - updated values reflected in GET call, then delete and verify removed', async ({ restClient }) => {
    const appId = generateAppId();
    const token = await getBearerHeader();
    const createBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: appId,
            applicationName: 'Original Name',
            supportEmail: 'original@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    await withTestApp(restClient, token, appId, createBody, async () => {
      await restClient.put(`${BASE_PATH}${appId}`, {
        data: {
          type: 'customer-data-privacy',
          attributes: {
            payload: {
              applicationName: 'Updated Name',
              supportEmail: 'updated@dowjones.com',
              applicationCategory: ['B2C'],
              status: 'Active',
              updatedBy: CREATED_BY,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      }, { headers: getStandardHeaders(token) });

      const getResponse = await restClient.get(BASE_PATH, {
        headers: getStandardHeaders(token),
        queryParams: { applicationId: appId },
      });
      const getBody = await getResponse.json();
      await attachToAllure('GET Response after PUT', getBody);

      expect(getResponse.statusCode).toBe(200);
      const reg = getBody.data.attributes.payload.dataPrivacyRegistration[0];
      expect(reg.applicationName).toBe('Updated Name');
      expect(reg.supportEmail).toBe('updated@dowjones.com');
    });
  });

  test('@regression PUT - non-existent applicationId returns 404', async ({ restClient }) => {
    const token = await getBearerHeader();
    const updateBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationName: 'Some Name',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            updatedBy: CREATED_BY,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };

    await attachToAllure('Request Body', updateBody);

    const response = await restClient.put(`${BASE_PATH}NON_EXISTENT_APP_XYZ_999`, updateBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(404);
  });

  test('@regression PUT - missing required field supportEmail returns 400', async ({ restClient }) => {
    const token = await getBearerHeader();
    const updateBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationName: 'Some Name',
            applicationCategory: ['B2C'],
            status: 'Active',
            updatedBy: CREATED_BY,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };

    // Get any existing appId from DB
    const dbApps = await query<{ application_id: string }>(`
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry LIMIT 1
    `);
    const appId = dbApps[0]?.application_id || 'SOME_APP';

    await attachToAllure('Request Body', updateBody);

    const response = await restClient.put(`${BASE_PATH}${appId}`, updateBody, {
      headers: getStandardHeaders(token),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

  test('@regression PUT - returns 401 with invalid token', async ({ restClient }) => {
    const updateBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationName: 'Some Name',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            updatedBy: CREATED_BY,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };

    await attachToAllure('Request Body', updateBody);

    const response = await restClient.put(`${BASE_PATH}SOME_APP`, updateBody, {
      headers: getStandardHeaders('Bearer invalid-token'),
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(401);
  });

  test('@regression PUT - returns 400 when required headers are missing', async ({ restClient }) => {
    const token = await getBearerHeader();
    const updateBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationName: 'Some Name',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            updatedBy: CREATED_BY,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };

    await attachToAllure('Request Body', updateBody);

    const response = await restClient.put(`${BASE_PATH}SOME_APP`, updateBody, {
      headers: { Authorization: token },
    });
    await attachToAllure('Response Body', await response.json());
    expect(response.statusCode).toBe(400);
  });

});

// ============================================================
// DELETE lifecycle: POST → DELETE → verify removed
// ============================================================

test.describe('DELETE /registration/{applicationId} (lifecycle)', () => {

  test('@regression DELETE - create via POST then delete and verify removed from DB', async ({ restClient }) => {
    const appId = generateAppId();
    const token = await getBearerHeader();

    // Step 1: Create application
    const createBody = {
      data: {
        type: 'customer-data-privacy',
        attributes: {
          payload: {
            applicationId: appId,
            applicationName: 'App To Delete',
            supportEmail: 'api-automation@dowjones.com',
            applicationCategory: ['B2C'],
            status: 'Active',
            createdBy: CREATED_BY,
          },
        },
      },
    };

    await attachToAllure('Step 1 - POST Request Body', createBody);

    const createResponse = await restClient.post(BASE_PATH, createBody, {
      headers: getStandardHeaders(token),
    });
    const createBody2 = await createResponse.json();

    await attachToAllure('Step 1 - POST Response Body', createBody2);
    expect(createResponse.statusCode).toBe(201);

    // Verify created in DB
    const dbAfterCreate = await query<{ application_id: string }>(`
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
      WHERE application_id = ? LIMIT 1
    `, [appId]);
    expect(dbAfterCreate.length, `App ${appId} should exist in DB after creation`).toBe(1);

    // Step 2: Delete the application
    const deleteResponse = await restClient.delete(`${DELETE_PATH}${appId}`, {
      headers: getDeleteHeaders(token),
    });
    await attachToAllure('Step 2 - DELETE Response', { status: deleteResponse.statusCode });
    expect([200, 204]).toContain(deleteResponse.statusCode);

    // Step 3: Verify not in GET response
    const getResponse = await restClient.get(BASE_PATH, {
      headers: getStandardHeaders(token),
      queryParams: { applicationId: appId },
    });
    const getBody = await getResponse.json();

    await attachToAllure('Step 3 - GET Response after DELETE', getBody);

    expect(getResponse.statusCode).toBe(404);

    // Step 4: Verify removed from DB
    const dbAfterDelete = await query<{ application_id: string }>(`
      SELECT application_id FROM custpiidatadeletion.data_privacy_app_registry
      WHERE application_id = ? LIMIT 1
    `, [appId]);
    expect(dbAfterDelete.length, `App ${appId} should be removed from DB after deletion`).toBe(0);
  });

});
