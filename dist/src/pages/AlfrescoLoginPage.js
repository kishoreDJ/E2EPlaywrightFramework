"use strict";
/**
 * Alfresco Login Page - Alfresco Share CMS login at ALFRESCO_BASE_URL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlfrescoLoginPage = void 0;
const BasePage_1 = require("./BasePage");
class AlfrescoLoginPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.usernameInput = page.locator('#USERNAME, input[name="username"], #username');
        this.passwordInput = page.locator('#PASSWORD, input[name="password"], #password');
        this.signInButton = page.getByText('Sign In', { exact: true });
        this.userMenu = page.locator('#HEADER_USER_MENU_POPUP_text');
    }
    async openDocumentLibrary() {
        await this.goto(process.env.ALFRESCO_BASE_URL + 'share/page/site/djcss/documentlibrary');
    }
    async login(username, password) {
        await this.usernameInput.first().fill(username);
        await this.passwordInput.first().fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    isLoggedIn() {
        return this.userMenu;
    }
}
exports.AlfrescoLoginPage = AlfrescoLoginPage;
