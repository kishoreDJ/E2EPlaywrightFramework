import { test } from '../../src/fixtures/rest-client.fixture';
import { expect } from '../../src/helpers/allureExpect';
import { getBatchesToken } from '../../src/helpers/authHelper';
import { getStandardHeaders } from '../../src/helpers/requestHeaders';
import { WorkflowTriggerResponseSchema } from './schemas/workflow-trigger.schema';

const BATCHES_BASE_URL = process.env.BATCHES_BASE_URL || 'https://api-int.mosaic-cdpr-batches.mosaic-stag.dowjones.io';
const WORKFLOW_TRIGGER_PATH = '/workflow/api/trigger';

test.describe('Workflow Trigger API Tests - DSAR_DONOTSELL', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getBatchesToken();
  });

  // ─── Happy Path ───────────────────────────────────────────────────────────

  test('WFT-001: trigger workflow for DSAR_DONOTSELL returns 200', async ({ api }) => {
    const response = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(response.status()).toBe(200);
  });

  // ─── Validation Error Cases ───────────────────────────────────────────────

  test('WFT-002: trigger workflow with invalid workflowCategory returns 400', async ({ api }) => {
    const response = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
      params: { workflowCategory: 'INVALID_CATEGORY' },
    });
    expect(response.status()).toBe(400);
  });

  test('WFT-003: trigger workflow without workflowCategory param returns 400', async ({ api }) => {
    const response = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
    });
    expect(response.status()).toBe(400);
  });

  test('WFT-004: trigger workflow with invalid auth token returns 401', async ({ api }) => {
    const response = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: {
        ...getStandardHeaders(token),
        Authorization: 'Bearer invalid-token',
      },
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(response.status()).toBe(401);
  });

  // ─── Response Body + Schema Validation ───────────────────────────────────

  test('WFT-005: DSAR_DONOTSELL response body passes schema validation', async ({ api }) => {
    const response = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(response.status()).toBe(200);

    const body = await response.text();
    const parsed = WorkflowTriggerResponseSchema.safeParse(body);
    expect(parsed.success, `Schema validation failed: ${!parsed.success ? JSON.stringify(parsed.error.issues) : ''}`).toBe(true);
  });

  // ─── Repeated Triggers ────────────────────────────────────────────────────

  test('WFT-006: triggering DSAR_DONOTSELL twice in succession both return 200 with valid schema', async ({ api }) => {
    const first = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(first.status()).toBe(200);
    const firstBody = WorkflowTriggerResponseSchema.safeParse(await first.text());
    expect(firstBody.success).toBe(true);

    const second = await api.post(`${BATCHES_BASE_URL}${WORKFLOW_TRIGGER_PATH}`, {
      headers: getStandardHeaders(token),
      params: { workflowCategory: 'DSAR_DONOTSELL' },
    });
    expect(second.status()).toBe(200);
    const secondBody = WorkflowTriggerResponseSchema.safeParse(await second.text());
    expect(secondBody.success).toBe(true);
  });
});
