/**
 * Identity Headers - Builds the 4 request-identity headers required by
 * every referral-services endpoint (validated by ValidateHeaders server-side).
 * Origin/Source-Application-Request-Identifier must be a fresh RFC 4122 UUID per request.
 */

import { randomUUID } from 'crypto';

export interface IdentityHeaderOptions {
  originAppName?: string;
  sourceAppName?: string;
  originRequestId?: string;
  sourceRequestId?: string;
}

export function buildIdentityHeaders(options: IdentityHeaderOptions = {}): Record<string, string> {
  const appName = options.originAppName ?? 'SelfService';

  return {
    'Origin-Application-Name': appName,
    'Origin-Application-Request-Identifier': options.originRequestId ?? randomUUID(),
    'Source-Application-Name': options.sourceAppName ?? appName,
    'Source-Application-Request-Identifier': options.sourceRequestId ?? randomUUID(),
  };
}
