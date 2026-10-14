"use strict";
/**
 * Live Chat Page - https://customer.qa.dowjones.com/contact/liveChat
 * Reached via Contact Us -> Live Chat in the top navigation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChatPage = void 0;
const BasePage_1 = require("./BasePage");
class LiveChatPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.firstNameInput = page.locator('#firstName');
        this.lastNameInput = page.locator('#lastName');
        this.emailInput = page.locator('#email');
        this.countryButton = page.locator('button[role="combobox"][aria-label="Country"]');
        this.phoneInput = page.locator('#phone');
        this.productLineCombobox = page.locator('[role="combobox"]', { has: page.locator('#productLine') });
        this.productAreaCombobox = page.locator('[role="combobox"]', { has: page.locator('#productArea') });
        this.languageCombobox = page.locator('[role="combobox"]', { has: page.locator('#language') });
        this.messageInput = page.locator('#message');
        this.startChatButton = page.getByText('START CHAT', { exact: false });
        this.attentionOverlayCloseButton = page.locator('.sc-qOiPt [role="button"]', { hasText: 'Close' });
        this.dropdownOption = page.locator('[role="option"]');
    }
    async open() {
        await this.clickNavLink('Contact Us');
        await this.page.getByText('Live Chat', { exact: true }).first().click();
        await this.waitForPageLoad();
        await this.dismissAttentionOverlayIfPresent();
    }
    async dismissAttentionOverlayIfPresent() {
        if (await this.attentionOverlayCloseButton.isVisible().catch(() => false)) {
            await this.attentionOverlayCloseButton.click();
        }
    }
    async fillContactDetails(details) {
        if (details.firstName)
            await this.firstNameInput.fill(details.firstName);
        if (details.lastName)
            await this.lastNameInput.fill(details.lastName);
        if (details.email)
            await this.emailInput.fill(details.email);
        if (details.phone)
            await this.phoneInput.fill(details.phone);
        if (details.message)
            await this.messageInput.fill(details.message);
    }
    async selectCountry(countryName) {
        await this.countryButton.click();
        await this.dropdownOption.filter({ hasText: countryName }).first().click();
    }
    async selectProductLine(productLineName) {
        await this.productLineCombobox.click();
        await this.dropdownOption.filter({ hasText: productLineName }).first().click();
    }
    async selectProductArea(productAreaName) {
        await this.productAreaCombobox.click();
        await this.dropdownOption.filter({ hasText: productAreaName }).first().click();
    }
    async selectLanguage(languageName) {
        await this.languageCombobox.click();
        await this.dropdownOption.filter({ hasText: languageName }).first().click();
    }
    async getLanguageOptions() {
        await this.languageCombobox.click();
        const options = await this.dropdownOption.allTextContents();
        await this.page.keyboard.press('Escape');
        return options;
    }
    async getProductAreaOptions() {
        await this.productAreaCombobox.click();
        const options = await this.dropdownOption.allTextContents();
        await this.page.keyboard.press('Escape');
        return options;
    }
    async clickStartChat() {
        await this.startChatButton.click();
    }
    getSelectedLanguage() {
        return this.page.locator('#language').inputValue();
    }
    getSelectedProductArea() {
        return this.page.locator('#productArea').inputValue();
    }
    getValidationErrors() {
        return this.page
            .locator('[id*="Error"], [class*="error" i]')
            .allTextContents()
            .then((texts) => texts.map((t) => t.trim()).filter((t) => t.length > 0));
    }
}
exports.LiveChatPage = LiveChatPage;
