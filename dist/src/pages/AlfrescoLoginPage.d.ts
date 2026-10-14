/**
 * Alfresco Login Page - Alfresco Share CMS login at ALFRESCO_BASE_URL
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class AlfrescoLoginPage extends BasePage {
    private readonly usernameInput;
    private readonly passwordInput;
    private readonly signInButton;
    private readonly userMenu;
    constructor(page: Page);
    openDocumentLibrary(): Promise<void>;
    login(username: string, password: string): Promise<void>;
    isLoggedIn(): Locator;
}
//# sourceMappingURL=AlfrescoLoginPage.d.ts.map