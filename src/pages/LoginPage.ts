/**
 * Login Page - DJCSS login redirects to Dow Jones SSO (sso.int.accounts.dowjones.com)
 * before returning to https://customer.qa.dowjones.com/
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton: Locator;
  private readonly maintenanceOkButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password-form-item');
    this.signInButton = page.locator('#signin-btn');
    this.maintenanceOkButton = page.locator('#okBtn');
  }

  /** Dismisses the "Scheduled Maintenance" notice if it's covering the login form. */
  public async dismissMaintenanceNoticeIfPresent(): Promise<void> {
    if (await this.maintenanceOkButton.isVisible().catch(() => false)) {
      await this.maintenanceOkButton.click();
    }
  }

  public async login(username: string, password: string): Promise<void> {
    await this.dismissMaintenanceNoticeIfPresent();
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
