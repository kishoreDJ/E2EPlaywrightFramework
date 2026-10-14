"use strict";
/**
 * Login Page - DJCSS login redirects to Dow Jones SSO (sso.int.accounts.dowjones.com)
 * before returning to https://customer.qa.dowjones.com/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const BasePage_1 = require("./BasePage");
class LoginPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password-form-item');
        this.signInButton = page.locator('#signin-btn');
        this.maintenanceOkButton = page.locator('#okBtn');
    }
    /** Dismisses the "Scheduled Maintenance" notice if it's covering the login form. */
    async dismissMaintenanceNoticeIfPresent() {
        if (await this.maintenanceOkButton.isVisible().catch(() => false)) {
            await this.maintenanceOkButton.click();
        }
    }
    async login(username, password) {
        await this.dismissMaintenanceNoticeIfPresent();
        await this.emailInput.fill(username);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('networkidle');
    }
}
exports.LoginPage = LoginPage;
