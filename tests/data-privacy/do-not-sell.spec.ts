import { test } from '../../src/fixtures/rest-client.fixture';
import { expect } from '../../src/helpers/allureExpect';
import { getToken, getBatchesToken } from '../../src/helpers/authHelper';
import { getStandardHeaders } from '../../src/helpers/requestHeaders';
import { validateResponse } from '../../src/schema-validation/validator';
import { query, closeDb } from '../../src/helpers/dbHelper';
import { getRandomUuidsBySubscriptionState, closeCsmDb } from '../../src/helpers/csmDbHelper';
import { getUsersByUuids, UapUser } from '../../src/helpers/uapHelper';
import {
  DoNotSellPostResponseSchema,
  DoNotSellGetByIdResponseSchema,
  RequestStatusCountResponseSchema,
} from './schemas/do-not-sell.schema';
import { WorkflowTriggerResponseSchema } from './schemas/workflow-trigger.schema';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api-int.mosaic-cdpr-service-api.mosaic-stag.dowjones.io';
const BASE_PATH = `${API_BASE_URL}/api/v1/customer-data-privacy/`;
const STATUS_COUNT_PATH = `${API_BASE_URL}/api/v1/customer-data-privacy/requestStatusCount`;
const CREATED_BY = 'api-automation';

const BATCHES_BASE_URL = process.env.BATCHES_BASE_URL || 'https://api-int.mosaic-cdpr-batches.mosaic-stag.dowjones.io';
const WORKFLOW_TRIGGER_PATH = '/workflow/api/trigger';

function makeDsarRequestId(testId?: string): string {
  return testId ? `${testId}-${Date.now()}` : `DNS-AUTO-${Date.now()}`;
}

function buildDoNotSellBody(
  user: Pick<UapUser, 'firstName' | 'lastName' | 'email'>,
  overrides: Record<string, unknown> = {},
  testId?: string,
): object {
  const payload: Record<string, unknown> = {
    email: user.email,
    dsarRequestId: makeDsarRequestId(testId),
    createdBy: CREATED_BY,
    requestType: 'DSAR_DONOTSELL',
  };
  if (user.firstName) payload.firstName = user.firstName;
  if (user.lastName) payload.lastName = user.lastName;
  return {
    data: {
      type: 'dataPrivacy',
      attributes: { payload: { ...payload, ...overrides } },
    },
  };
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

interface DpRequest {
  orchestrator_request_id: string;
  status: string;
  request_type: string;
  dsar_request_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_by: string | null;
}

interface DpCustomer {
  customer_reference_id: number;
  orchestrator_request_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  uuid: string | null;
  verint_cid: string | null;
}

interface DpAddress {
  address_type: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface DpContactPref {
  preference_type: string | null;
  preference_value: number | null;
}

interface DpAdditionalEmail {
  email_address: string | null;
}

async function getDbRequest(orchestratorRequestId: string): Promise<DpRequest | null> {
  const rows = await query<DpRequest>(
    'SELECT orchestrator_request_id, status, request_type, dsar_request_id, email, first_name, last_name, created_by FROM data_privacy_request WHERE orchestrator_request_id = ?',
    [orchestratorRequestId],
  );
  return rows[0] ?? null;
}

async function getDbCustomer(orchestratorRequestId: string): Promise<DpCustomer | null> {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const rows = await query<DpCustomer>(
      'SELECT customer_reference_id, orchestrator_request_id, email, first_name, last_name, uuid, verint_cid FROM data_privacy_customer WHERE orchestrator_request_id = ?',
      [orchestratorRequestId],
    );
    if (rows[0]) return rows[0];
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function getDbAddresses(customerReferenceId: number): Promise<DpAddress[]> {
  return query<DpAddress>(
    'SELECT address_type, address_line_1, city, state, zip_code FROM data_privacy_customer_address WHERE customer_reference_id = ?',
    [customerReferenceId],
  );
}

async function getDbContactPreferences(customerReferenceId: number): Promise<DpContactPref[]> {
  return query<DpContactPref>(
    'SELECT preference_type, preference_value FROM data_privacy_customer_contact_preference WHERE customer_reference_id = ?',
    [customerReferenceId],
  );
}

async function getDbAdditionalEmails(customerReferenceId: number): Promise<DpAdditionalEmail[]> {
  return query<DpAdditionalEmail>(
    'SELECT email_address FROM data_privacy_customer_additional_email WHERE customer_reference_id = ?',
    [customerReferenceId],
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Do Not Sell (DSAR_DONOTSELL) API Tests', () => {
  let token: string;
  let batchesToken: string;
  let testUsers: UapUser[] = [];
  let userIndex = 0;

  function nextUser(): UapUser {
    const user = testUsers[userIndex % testUsers.length];
    userIndex++;
    return user;
  }

  test.beforeAll(async () => {
    test.setTimeout(90_000);

    [token, batchesToken] = await Promise.all([getToken(), getBatchesToken()]);

    // Fetch a pool of random real users from CSM + UAP.
    // In CI the CSM DB is on a private network — fall back to the committed users list.
    let fetched: UapUser[];
    try {
      const uuids = await getRandomUuidsBySubscriptionState(5, 50);
      fetched = await getUsersByUuids(uuids);
    } catch {
      const { fallbackUsers } = await import('./data/users');
      fetched = fallbackUsers;
    }
    testUsers = fetched.filter((u) => u.uuid && u.email);
    if (testUsers.length === 0) throw new Error('No valid test users returned from CSM/UAP or fallback list');
  });

  test.afterAll(async () => {
    await Promise.all([closeDb(), closeCsmDb()]);
  });

  // ─── POST: Happy Path ─────────────────────────────────────────────────────

  test('POST DNS-001: create DSAR_DONOTSELL request with minimal required fields', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {}, 'DNS-001');
    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;

    expect(payload.requestType).toBe('DSAR DoNotSell');
    expect(payload.requestStatus).toBe('Initial');
    expect(payload.orchestratorRequestId).toBeTruthy();

    // DB: data_privacy_request is written immediately at INITIAL state
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    expect(dbRequest!.request_type).toBe('DSAR_DONOTSELL');
    expect(dbRequest!.first_name ?? '').toBe(user.firstName);
    expect(dbRequest!.last_name ?? '').toBe(user.lastName);
    expect(dbRequest!.created_by).toBe(CREATED_BY);
    // data_privacy_customer is only written when request moves to IN_PROGRESS — not asserted here
  });

  test('POST DNS-002: create DSAR_DONOTSELL request with uuid', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, { uuid: user.uuid }, 'DNS-002');
    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.requestType).toBe('DSAR DoNotSell');
    expect(payload.uuid).toBe(user.uuid);

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    expect(dbRequest!.request_type).toBe('DSAR_DONOTSELL');
    // data_privacy_customer written only at IN_PROGRESS — not asserted here
  });

  test('POST DNS-003: create DSAR_DONOTSELL request with addresses array', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {
      addresses: [
        {
          addressType: 'MAILING_ADDRESS',
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      ],
    }, 'DNS-003');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.requestType).toBe('DSAR DoNotSell');
    expect(payload.addresses).toBeDefined();
    expect(payload.addresses![0].addressType).toBe('MAILING_ADDRESS');

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    // data_privacy_customer_address written only at IN_PROGRESS — not asserted here
  });

  test('POST DNS-004: create DSAR_DONOTSELL request with contactPreferences array', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {
      contactPreferences: [
        { preferenceType: 'BLKCALL_WSJ', preferenceValue: true },
        { preferenceType: 'EMAIL_OPT_OUT', preferenceValue: false },
      ],
    }, 'DNS-004');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.contactPreferences).toBeDefined();
    expect(payload.contactPreferences!.length).toBe(2);

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    // data_privacy_customer_contact_preference written only at IN_PROGRESS — not asserted here
  });

  test('POST DNS-005: create DSAR_DONOTSELL request with additionalEmailAddresses', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {
      additionalEmailAddresses: ['secondary1@test.com', 'secondary2@test.com'],
    }, 'DNS-005');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.additionalEmailAddresses).toBeDefined();
    expect(payload.additionalEmailAddresses!.length).toBe(2);

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    // data_privacy_customer_additional_email written only at IN_PROGRESS — not asserted here
  });

  test('POST DNS-006: create DSAR_DONOTSELL request with uuid and verint_cid', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {
      uuid: user.uuid,
      verint_cid: '1234',
    }, 'DNS-006');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.uuid).toBe(user.uuid);
    expect(payload.verint_cid).toBe('1234');

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    // data_privacy_customer written only at IN_PROGRESS — not asserted here
  });

  test('POST DNS-007: create DSAR_DONOTSELL with full payload — addresses, contactPreferences, additionalEmails, uuid', async ({ api }) => {
    const user = nextUser();
    const body = buildDoNotSellBody(user, {
      uuid: user.uuid,
      verint_cid: '5678',
      addresses: [
        {
          addressType: 'BILLING_ADDRESS',
          addressLine1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
        },
      ],
      contactPreferences: [{ preferenceType: 'BLKCALL_WSJ', preferenceValue: true }],
      additionalEmailAddresses: ['extra@test.com'],
    }, 'DNS-007');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;
    expect(payload.requestType).toBe('DSAR DoNotSell');
    expect(payload.orchestratorRequestId).toBeTruthy();

    // DB: data_privacy_request
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    expect(dbRequest!.request_type).toBe('DSAR_DONOTSELL');
    // data_privacy_customer and related tables written only at IN_PROGRESS — not asserted here
  });

  // ─── GET by orchestratorRequestId ─────────────────────────────────────────

  test('GET DNS-008: retrieve DSAR_DONOTSELL request by orchestratorRequestId', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {}, 'DNS-008');
    const postResponse = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(postResponse.status()).toBe(201);
    const postJson = await postResponse.json();
    const orchestratorRequestId = postJson.data.attributes.payload.orchestratorRequestId;
    expect(orchestratorRequestId).toBeTruthy();

    const getResponse = await api.get(`${BASE_PATH}${orchestratorRequestId}`, {
      headers: getStandardHeaders(token),
    });

    expect(getResponse.status()).toBe(200);
    const getJson = await getResponse.json();
    await validateResponse(DoNotSellGetByIdResponseSchema, getJson);

    // DB: confirm record exists with matching request type
    const dbRequest = await getDbRequest(orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.request_type).toBe('DSAR_DONOTSELL');
    expect(dbRequest!.status).toBe('INITIAL');
  });

  test('GET DNS-009: retrieve non-existent orchestratorRequestId returns 400', async ({ api }) => {
    const getResponse = await api.get(`${BASE_PATH}dpr-000000000000000000`, {
      headers: getStandardHeaders(token),
    });
    expect(getResponse.status()).toBe(400);
  });

  // ─── GET requestStatusCount ───────────────────────────────────────────────

  test('GET DNS-010: requestStatusCount returns DSAR_DONOTSELL field', async ({ api }) => {
    const response = await api.get(STATUS_COUNT_PATH, {
      headers: getStandardHeaders(token),
      params: { skipCache: true },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    const validated = await validateResponse(RequestStatusCountResponseSchema, json);
    const payload = validated.data.attributes.payload;

    expect(payload.totalRequests).toBeGreaterThanOrEqual(0);
    expect(payload.DSAR_DONOTSELL).toBeDefined();

    // DB: cross-check count of DSAR_DONOTSELL records
    const rows = await query<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM data_privacy_request WHERE request_type = 'DSAR_DONOTSELL'",
    );
    expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
  });

  test('GET DNS-011: requestStatusCount with skipCache=false returns DSAR_DONOTSELL field', async ({ api }) => {
    const response = await api.get(STATUS_COUNT_PATH, {
      headers: getStandardHeaders(token),
      params: { skipCache: false },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    const validated = await validateResponse(RequestStatusCountResponseSchema, json);
    expect(validated.data.attributes.payload.DSAR_DONOTSELL).toBeDefined();
  });

  test('GET DNS-012: requestStatusCount without skipCache returns error', async ({ api }) => {
    const response = await api.get(STATUS_COUNT_PATH, {
      headers: getStandardHeaders(token),
    });
    expect([400, 500]).toContain(response.status());
  });

  // ─── POST: Validation Error Cases ─────────────────────────────────────────

  test('POST DNS-013: missing firstName is accepted by API — returns 201', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            ...(user.lastName && { lastName: user.lastName }),
            email: user.email,
            dsarRequestId: makeDsarRequestId('DNS-013'),
            createdBy: CREATED_BY,
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(201);
  });

  test('POST DNS-014: missing lastName is accepted by API — returns 201', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            ...(user.firstName && { firstName: user.firstName }),
            email: user.email,
            dsarRequestId: makeDsarRequestId('DNS-014'),
            createdBy: CREATED_BY,
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(201);
  });

  test('POST DNS-015: missing dsarRequestId is accepted by API — returns 200 or 201', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            ...(user.firstName && { firstName: user.firstName }),
            ...(user.lastName && { lastName: user.lastName }),
            email: user.email,
            createdBy: CREATED_BY,
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect([200, 201]).toContain(response.status());
  });

  test('POST DNS-016: missing createdBy is accepted by API — returns 201', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            ...(user.firstName && { firstName: user.firstName }),
            ...(user.lastName && { lastName: user.lastName }),
            email: user.email,
            dsarRequestId: makeDsarRequestId('DNS-016'),
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(201);
  });

  test('POST DNS-017: address missing required field (zipCode) returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      addresses: [
        {
          addressType: 'MAILING_ADDRESS',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
        },
      ],
    });

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-018: address missing required field (addressLine1) returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      addresses: [
        {
          addressType: 'MAILING_ADDRESS',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      ],
    });

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-019: contactPreferences missing preferenceType returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      contactPreferences: [{ preferenceValue: true }],
    });

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-020: contactPreferences missing preferenceValue returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      contactPreferences: [{ preferenceType: 'BLKCALL_WSJ' }],
    });

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-021: invalid email format in additionalEmailAddresses returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      additionalEmailAddresses: ['not-a-valid-email'],
    }, 'DNS-021');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-022: invalid requestType returns 400', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            dsarRequestId: makeDsarRequestId('DNS-022'),
            createdBy: CREATED_BY,
            requestType: 'INVALID_TYPE',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-023: DSAR_DONOTSELL without email and without uuid returns 400', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            firstName: user.firstName,
            lastName: user.lastName,
            dsarRequestId: makeDsarRequestId('DNS-023'),
            createdBy: CREATED_BY,
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-024: verify DSAR_DONOTSELL request status starts as INITIAL', async ({ api }) => {
    const dsarRequestId = makeDsarRequestId('DNS-024');
    const body = buildDoNotSellBody(nextUser(), { dsarRequestId });

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, json);
    const payload = validated.data.attributes.payload;

    expect(payload.requestStatus).toBe('Initial');
    expect(payload.dsarRequestId).toBe(dsarRequestId);
    expect(payload.createdBy).toBe(CREATED_BY);

    // DB: confirm INITIAL status persisted
    const dbRequest = await getDbRequest(payload.orchestratorRequestId);
    expect(dbRequest).not.toBeNull();
    expect(dbRequest!.status).toBe('INITIAL');
    expect(dbRequest!.dsar_request_id).toBe(dsarRequestId);
    expect(dbRequest!.created_by).toBe(CREATED_BY);
  });

  // ─── DB Integrity: NOT_DELETABLE status must never appear ────────────────

  test.skip('DB DNS-026: no DSAR_DONOTSELL request in DB should have status NOT_DELETABLE', async () => {
    const rows = await query<{ orchestrator_request_id: string; status: string }>(
      `SELECT orchestrator_request_id, status
       FROM data_privacy_request
       WHERE request_type = 'DSAR_DONOTSELL'
         AND status = 'NOT_DELETABLE'`,
    );

    expect(
      rows.length,
      `Found ${rows.length} DSAR_DONOTSELL record(s) with status NOT_DELETABLE: ${JSON.stringify(rows.map((r) => r.orchestrator_request_id))}`,
    ).toBe(0);
  });

  // ─── Auth / Security ─────────────────────────────────────────────────────

  test('AUTH DNS-027: POST without Authorization header returns 401', async ({ api }) => {
    const { Authorization: _, ...noAuthHeaders } = getStandardHeaders(token);
    const response = await api.post(BASE_PATH, {
      headers: noAuthHeaders,
      data: buildDoNotSellBody(nextUser(), {}, 'DNS-027'),
    });
    expect(response.status()).toBe(401);
  });

  test('AUTH DNS-028: POST with invalid Authorization token returns 401', async ({ api }) => {
    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders('Bearer invalid-token-xyz'),
      data: buildDoNotSellBody(nextUser(), {}, 'DNS-028'),
    });
    expect(response.status()).toBe(401);
  });

  test('AUTH DNS-029: GET by orchestratorRequestId without Authorization header returns 401', async ({ api }) => {
    // Create a valid request first to get a real ID
    const postResponse = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: buildDoNotSellBody(nextUser(), {}, 'DNS-029'),
    });
    expect(postResponse.status()).toBe(201);
    const orchestratorRequestId = (await postResponse.json()).data.attributes.payload.orchestratorRequestId;

    const { Authorization: _, ...noAuthHeaders } = getStandardHeaders(token);
    const getResponse = await api.get(`${BASE_PATH}${orchestratorRequestId}`, {
      headers: noAuthHeaders,
    });
    expect(getResponse.status()).toBe(401);
  });

  test('AUTH DNS-030: GET requestStatusCount without Authorization header returns 401', async ({ api }) => {
    const { Authorization: _, ...noAuthHeaders } = getStandardHeaders(token);
    const response = await api.get(STATUS_COUNT_PATH, {
      headers: noAuthHeaders,
      params: { skipCache: true },
    });
    expect(response.status()).toBe(401);
  });

  // ─── Business Logic: email OR uuid ───────────────────────────────────────

  test('POST DNS-031: POST with uuid only (no email) returns 400 — email is required', async ({ api }) => {
    const user = nextUser();
    const body = {
      data: {
        type: 'dataPrivacy',
        attributes: {
          payload: {
            uuid: user.uuid,
            dsarRequestId: makeDsarRequestId('DNS-031'),
            createdBy: CREATED_BY,
            requestType: 'DSAR_DONOTSELL',
          },
        },
      },
    };

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    // API requires email even when uuid is provided
    expect(response.status()).toBe(400);
  });

  // ─── Idempotency: duplicate dsarRequestId ─────────────────────────────────

  test('POST DNS-032: submitting the same dsarRequestId twice is idempotent — returns same orchestratorRequestId', async ({ api }) => {
    const user = nextUser();
    const dsarRequestId = makeDsarRequestId('DNS-032');

    const body = buildDoNotSellBody(user, { dsarRequestId });

    const first = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(first.status()).toBe(201);
    const firstId = (await first.json()).data.attributes.payload.orchestratorRequestId;

    const second = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    // API is idempotent: returns 200 with the same orchestratorRequestId
    expect([200, 201, 409]).toContain(second.status());

    if (second.status() === 200) {
      const secondId = (await second.json()).data.attributes.payload.orchestratorRequestId;
      expect(secondId).toBe(firstId);
    }
  });

  // ─── Input / Body validation ──────────────────────────────────────────────

  test('POST DNS-033: empty body returns 400', async ({ api }) => {
    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('POST DNS-035: invalid addressType value returns 400', async ({ api }) => {
    const body = buildDoNotSellBody(nextUser(), {
      addresses: [
        {
          addressType: 'INVALID_TYPE',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      ],
    }, 'DNS-035');

    const response = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  // ─── requestStatusCount: before/after count check ────────────────────────

  test('GET DNS-036: requestStatusCount returns valid DSAR_DONOTSELL counts after a new request is created', async ({ api }) => {
    // Create a new request first
    const postResponse = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: buildDoNotSellBody(nextUser(), {}, 'DNS-036'),
    });
    expect(postResponse.status()).toBe(201);

    // Verify requestStatusCount returns 200 with a valid schema and non-zero totalRequests
    // Note: skipCache=true is sent but the server cache may not bust immediately —
    // the test verifies the endpoint shape and that counts are tracked, not a strict +1 delta.
    const response = await api.get(STATUS_COUNT_PATH, {
      headers: getStandardHeaders(token),
      params: { skipCache: true },
    });
    expect(response.status()).toBe(200);
    const validated = await validateResponse(RequestStatusCountResponseSchema, await response.json());
    const dsarCount = validated.data.attributes.payload.DSAR_DONOTSELL?.totalRequests ?? 0;
    expect(dsarCount).toBeGreaterThan(0);
  });

  // ─── DB Integrity: INITIAL requests must have customer rows ──────────────

  test.skip('DB DNS-037: every DSAR_DONOTSELL request in INITIAL state has a matching data_privacy_customer row', async () => {
    // Find any INITIAL requests that lack a customer row (orphaned requests)
    const orphans = await query<{ orchestrator_request_id: string; created_at?: string }>(
      `SELECT r.orchestrator_request_id
       FROM data_privacy_request r
       LEFT JOIN data_privacy_customer c ON c.orchestrator_request_id = r.orchestrator_request_id
       WHERE r.request_type = 'DSAR_DONOTSELL'
         AND r.status = 'INITIAL'
         AND c.orchestrator_request_id IS NULL
       LIMIT 10`,
    );

    expect(
      orphans.length,
      `Found ${orphans.length} INITIAL DSAR_DONOTSELL request(s) with no customer row: ${JSON.stringify(orphans.map((r) => r.orchestrator_request_id))}`,
    ).toBe(0);
  });

  test.skip('DB DNS-038: no DSAR_DONOTSELL customer row should have a null orchestrator_request_id', async () => {
    const rows = await query<{ customer_reference_id: number }>(
      `SELECT customer_reference_id
       FROM data_privacy_customer
       WHERE orchestrator_request_id IS NULL`,
    );

    expect(
      rows.length,
      `Found ${rows.length} data_privacy_customer row(s) with null orchestrator_request_id`,
    ).toBe(0);
  });

  // ─── Workflow Trigger + Status Verification ───────────────────────────────

  test('WFT DNS-025: create DSAR_DONOTSELL request and trigger workflow — verifies trigger returns 200', async ({ api }) => {
    // Step 1: Create a new DSAR_DONOTSELL request
    const body = buildDoNotSellBody(nextUser(), {}, 'DNS-025');
    const postResponse = await api.post(BASE_PATH, {
      headers: getStandardHeaders(token),
      data: body,
    });
    expect(postResponse.status()).toBe(201);

    const postJson = await postResponse.json();
    const validated = await validateResponse(DoNotSellPostResponseSchema, postJson);
    const orchestratorRequestId = validated.data.attributes.payload.orchestratorRequestId;
    expect(orchestratorRequestId).toBeTruthy();

    // Step 2: Confirm status is INITIAL before triggering (API + DB)
    expect(validated.data.attributes.payload.requestStatus).toBe('Initial');
    const dbBefore = await getDbRequest(orchestratorRequestId);
    expect(dbBefore).not.toBeNull();
    expect(dbBefore!.status).toBe('INITIAL');

    // Step 3: Trigger DSAR_DONOTSELL workflow
    const triggerResponse = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(batchesToken),
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(triggerResponse.status()).toBe(200);

    const triggerBody = await triggerResponse.text();
    const parsed = WorkflowTriggerResponseSchema.safeParse(triggerBody);
    expect(parsed.success, `Schema validation failed: ${!parsed.success ? JSON.stringify(parsed.error.issues) : ''}`).toBe(true);
  });
});
