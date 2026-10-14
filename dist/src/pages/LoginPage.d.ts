/**
 * Login Page - DJCSS login redirects to Dow Jones SSO (sso.int.accounts.dowjones.com)
 * before returning to https://customer.qa.dowjones.com/
 */
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class LoginPage extends BasePage {
    private readonly emailInput;
    private readonly passwordInput;
    private readonly signInButton;
    private readonly maintenanceOkButton;
    constructor(page: Page);
    /** Dismisses the "Scheduled Maintenance" notice if it's covering the login form. */
    dismissMaintenanceNoticeIfPresent(): Promise<void>;
    login(username: string, password: string): Promise<void>;
}
//# sourceMappingURL=LoginPage.d.ts.map