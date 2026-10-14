import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getRandomUuidsBySubscriptionState, closeCsmDb } from '../src/helpers/csmDbHelper';
import { getUsersByUuids } from '../src/helpers/uapHelper';

dotenv.config();

async function main() {
  console.log('Fetching UUIDs from CSM DB...');
  const uuids = await getRandomUuidsBySubscriptionState(5, 50);
  console.log(`Got ${uuids.length} UUIDs, fetching UAP user details...`);
  const users = await getUsersByUuids(uuids);
  const valid = users.filter((u) => u.uuid && u.email);
  console.log(`Got ${valid.length} valid users`);

  const lines = valid.map(
    (u) =>
      `  { uuid: '${u.uuid}', firstName: '${u.firstName}', lastName: '${u.lastName}', email: '${u.email}' }`,
  );

  const content = `import type { UapUser } from '../../../src/helpers/uapHelper';

/**
 * Fallback test users for CI environments where the CSM database is unreachable.
 * Populated from a local run — run scripts/generate-fallback-users.ts to refresh.
 */
export const fallbackUsers: UapUser[] = [
${lines.join(',\n')},
];
`;

  const outPath = path.join(__dirname, '../tests/data-privacy/data/users.ts');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`Written to ${outPath}`);
  await closeCsmDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
