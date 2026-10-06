/**
 * Base Page - shared navigation and wait helpers for all page objects
 */

import { Page } from '@playwright/test';
import { createLogger, Logger } from '../utils/logger';

export class BasePage {
  protected readonly log: Logger;

  constructor(protected readonly page: Page) {
    this.log = createLogger(this.constructor.name);
  }

  public async goto(path: string = '/'): Promise<void> {
    this.log.info(`Navigating to: ${path}`);
    await this.page.goto(path);
  }

  public async waitForPageLoad(): Promise<void> {
    this.log.debug('Waiting for networkidle');
    await this.page.waitForLoadState('networkidle');
  }

  public getTitle(): Promise<string> {
    return this.page.title();
  }

  public getUrl(): string {
    return this.page.url();
  }

  public async clickNavLink(linkText: string): Promise<void> {
    this.log.info(`Clicking nav link: "${linkText}"`);
    await this.page.getByText(linkText, { exact: true }).first().click();
    await this.waitForPageLoad();
  }

  /** Closes an overlay/modal if one happens to be visible, otherwise no-ops. */
  public async closePopupIfPresent(closeButtonText: string = 'Close'): Promise<void> {
    const closeButton = this.page.getByText(closeButtonText, { exact: true });
    if (await closeButton.isVisible().catch(() => false)) {
      this.log.info(`Closing popup: "${closeButtonText}"`);
      await closeButton.click();
    }
  }
}
