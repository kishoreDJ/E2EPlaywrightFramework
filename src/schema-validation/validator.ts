import { z } from 'zod';

async function allureAttach(name: string, data: unknown): Promise<void> {
  try {
    const { allure } = await import('allure-playwright');
    await allure.attachment(name, JSON.stringify(data, null, 2), 'application/json');
  } catch {
    // allure not available — skip silently
  }
}

export async function validateResponse<T>(schema: z.ZodSchema<T>, body: unknown): Promise<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      issue: issue.message,
      rule: issue.code,
    }));

    await allureAttach('Schema Validation Errors', formattedErrors);

    const errorMessageList = formattedErrors
      .map((err) => `  • [${err.field}]: ${err.issue}`)
      .join('\n');

    throw new Error(
      `Schema Validation Failed (${result.error.issues.length} issues):\n${errorMessageList}`
    );
  }

  await allureAttach('Schema Validation', { status: 'PASSED', schema: schema.description || 'valid' });

  return result.data;
}
