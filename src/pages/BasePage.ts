/**
 * Base Page - shared navigation and wait helpers for all page objects
 */

import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  public async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  public async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  public getTitle(): Promise<string> {
    return this.page.title();
  }

  public getUrl(): string {
    return this.page.url();
  }

  public async clickNavLink(linkText: string): Promise<void> {
    await this.page.getByText(linkText, { exact: true }).first().click();
    await this.waitForPageLoad();
  }

  /** Closes an overlay/modal if one happens to be visible, otherwise no-ops. */
  public async closePopupIfPresent(closeButtonText: string = 'Close'): Promise<void> {
    const closeButton = this.page.getByText(closeButtonText, { exact: true });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }
}
