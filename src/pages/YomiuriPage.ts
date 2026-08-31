/**
 * Dow Jones Yomiuri Standalone Page - https://customer.qa.dowjones.com/dowjonesyomiuri
 * Reached via Contact Us -> Dowjones Yomiuri in the top navigation.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class YomiuriPage extends BasePage {
  public readonly logo: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator('img[src*="djy-logo"]');
  }

  public async open(): Promise<void> {
    await this.goto('/dowjonesyomiuri');
    await this.waitForPageLoad();
  }
}
