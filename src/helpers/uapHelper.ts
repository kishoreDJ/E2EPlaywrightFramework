import * as dotenv from 'dotenv';
import { getBearerHeader } from './authHelper';

dotenv.config();

export interface UapUser {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getUapToken(): Promise<string> {
  return getBearerHeader(
    process.env.UAP_OAUTH_TOKEN_URL,
    process.env.UAP_OAUTH_CLIENT_ID,
    process.env.UAP_OAUTH_CLIENT_SECRET,
  );
}

const UAP_BATCH_SIZE = 1;

async function fetchUapBatch(uuids: string[], token: string, baseUrl: string): Promise<UapUser[]> {
  const filter = uuids.join(',');
  const url = `${baseUrl}/api/v1/users?filter[identityUUIDs]=${encodeURIComponent(filter)}`;
  const response = await fetch(
    url,
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        'origin-application-name': 'csm-listener',
        'source-application-name': 'csm-workflow',
        'origin-application-request-identifier': crypto.randomUUID(),
        'source-application-request-identifier': crypto.randomUUID(),
      },
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`UAP API request failed [${response.status}]: ${text.substring(0, 500)}`);
  }

  if (!text || text.trim() === '') return [];

  let json: {
    data?: {
      attributes?: {
        payload?: {
          users?: Array<{
            identityUUID?: string;
            firstName?: string;
            lastName?: string;
            emailAddress?: string;
            realm?: string;
          }>;
        };
      };
    };
  };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`UAP API returned non-JSON body [${response.status}]: ${text.substring(0, 500)}`);
  }

  const nameRegex = /^[A-Za-z\s]+$/;
  const users = json.data?.attributes?.payload?.users ?? [];
  return users
    .filter((u) => u.realm === 'primary' && u.identityUUID && u.emailAddress)
    .map((u) => ({
      uuid:      u.identityUUID ?? '',
      firstName: u.firstName && nameRegex.test(u.firstName) ? u.firstName : '',
      lastName:  u.lastName  && nameRegex.test(u.lastName)  ? u.lastName  : '',
      email:     u.emailAddress ?? '',
    }));
}

/**
 * Fetches user details from UAP for all given UUIDs in parallel.
 * Skips UUIDs that fail (not in UAP, offline users, 5xx errors).
 * Only returns primary-realm users with a real emailAddress.
 */
export async function getUsersByUuids(uuids: string[]): Promise<UapUser[]> {
  if (uuids.length === 0) return [];

  const token = await getUapToken();
  const baseUrl = process.env.UAP_BASE_URL || 'https://api-int.uap-user.customerappsstag.dowjones.io';

  const settled = await Promise.allSettled(
    uuids.map((uuid) => fetchUapBatch([uuid], token, baseUrl)),
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<UapUser[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

/**
 * Convenience: fetch a single user by UUID.
 */
export async function getUserByUuid(uuid: string): Promise<UapUser | null> {
  const users = await getUsersByUuids([uuid]);
  return users[0] ?? null;
}
