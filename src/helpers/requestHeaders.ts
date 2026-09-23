import { v4 as uuidv4 } from 'uuid';

/**
 * Generates standard request headers required by all APIs.
 * Values are read from .env — override per request if needed.
 *
 * Required .env variables:
 *   ORIGIN_APP_NAME  - Name of the origin application
 *   SOURCE_APP_NAME  - Name of the source application
 */
export function getStandardHeaders(token: string): Record<string, string> {
  return {
    Authorization: token,
    'origin-application-request-identifier': uuidv4(),
    'origin-application-name': process.env.ORIGIN_APP_NAME || 'TestFramework',
    'source-application-request-identifier': uuidv4(),
    'source-application-name': process.env.SOURCE_APP_NAME || 'TestFramework',
    'Content-Type': 'application/json',
  };
}

// DELETE requests must not include Content-Type to avoid 400 responses
export function getDeleteHeaders(token: string): Record<string, string> {
  const { 'Content-Type': _, ...headers } = getStandardHeaders(token);
  return headers;
}
