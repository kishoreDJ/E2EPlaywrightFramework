import { test, expect } from '../src/fixtures/browser-fixture';

test('should load Dow Jones AccelQ homepage', async ({ pooledPage }) => {
  await pooledPage.goto('https://dowjones.accelq.io/');

  await expect(pooledPage).toHaveURL(/dowjones\.accelq\.io/);
  await expect(pooledPage).toHaveTitle(/.+/);
});
