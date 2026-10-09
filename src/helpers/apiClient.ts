import { APIRequestContext, APIResponse } from '@playwright/test';
import { allure } from 'allure-playwright';

type RequestOptions = Parameters<APIRequestContext['post']>[1];
type StepFn = <T>(name: string, body: () => Promise<T>) => Promise<T>;
const step = allure.step as unknown as StepFn;

async function attach(name: string, data: unknown): Promise<void> {
  try {
    const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await allure.attachment(name, body, 'application/json');
  } catch {
    // allure not available — skip
  }
}

async function captureResponse(response: APIResponse, stepLabel: string): Promise<APIResponse> {
  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = await response.text();
  }
  if (response.status() >= 400) {
    console.log(`[API] ${stepLabel} [${response.status()}]:`, JSON.stringify(responseBody));
  }
  await attach(`${stepLabel} — Response (${response.status()})`, responseBody);
  return response;
}

export function apiClient(request: APIRequestContext) {
  return {
    async post(url: string, options?: RequestOptions): Promise<APIResponse> {
      const label = `POST ${new URL(url).pathname}`;
      return step(label, async () => {
        if (options?.data) await attach(`${label} — Request Body`, options.data);
        const response = await request.post(url, options);
        return captureResponse(response, label);
      });
    },

    async get(url: string, options?: RequestOptions): Promise<APIResponse> {
      const label = `GET ${new URL(url).pathname}`;
      return step(label, async () => {
        const response = await request.get(url, options);
        return captureResponse(response, label);
      });
    },

    async put(url: string, options?: RequestOptions): Promise<APIResponse> {
      const label = `PUT ${new URL(url).pathname}`;
      return step(label, async () => {
        if (options?.data) await attach(`${label} — Request Body`, options.data);
        const response = await request.put(url, options);
        return captureResponse(response, label);
      });
    },

    async delete(url: string, options?: RequestOptions): Promise<APIResponse> {
      const label = `DELETE ${new URL(url).pathname}`;
      return step(label, async () => {
        const response = await request.delete(url, options);
        return captureResponse(response, label);
      });
    },

    async patch(url: string, options?: RequestOptions): Promise<APIResponse> {
      const label = `PATCH ${new URL(url).pathname}`;
      return step(label, async () => {
        if (options?.data) await attach(`${label} — Request Body`, options.data);
        const response = await request.patch(url, options);
        return captureResponse(response, label);
      });
    },
  };
}
