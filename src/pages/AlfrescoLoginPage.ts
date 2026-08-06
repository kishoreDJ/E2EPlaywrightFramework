/**
 * Alfresco Login Page - Alfresco Share CMS login at ALFRESCO_BASE_URL
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlfrescoLoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton: Locator;
  private readonly userMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#USERNAME, input[name="username"], #username');
    this.passwordInput = page.locator('#PASSWORD, input[name="password"], #password');
    this.signInButton = page.getByText('Sign In', { exact: true });
    this.userMenu = page.locator('#HEADER_USER_MENU_POPUP_text');
  }

  public async openDocumentLibrary(): Promise<void> {
    await this.goto(process.env.ALFRESCO_BASE_URL + 'share/page/site/djcss/documentlibrary');
  }

  public async login(username: string, password: string): Promise<void> {
    await this.usernameInput.first().fill(username);
    await this.passwordInput.first().fill(password);
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  public isLoggedIn(): Locator {
    return this.userMenu;
  }
}
