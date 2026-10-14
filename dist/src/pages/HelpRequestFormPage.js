"use strict";
/**
 * Help Request Form - https://customer.qa.dowjones.com/contact/eform
 * Tabbed form: Help Request, Factiva Source Request, R&C profile update.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpRequestFormPage = void 0;
const BasePage_1 = require("./BasePage");
class HelpRequestFormPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.helpRequestTab = page.getByRole('tab', { name: 'Help Request', exact: true });
        this.factivaSourceRequestTab = page.getByRole('tab', { name: 'Factiva Source Request' });
        this.rcProfileUpdateTab = page.getByRole('tab', { name: 'R&C profile update' });
        this.addAttachmentButton = page.getByText('ADD ATTACHMENT', { exact: true });
        this.attachmentInput = page.locator('#attachment');
        this.productCombobox = page.locator('[role="combobox"]').filter({ has: page.locator('label[for="productLine"]') });
        this.productAreaCombobox = page
            .locator('[role="combobox"]')
            .filter({ has: page.locator('label[for="productArea"]') });
        this.languageCombobox = page.locator('[role="combobox"]').filter({ has: page.locator('label[for="language"]') });
        this.dropdownOption = page.locator('[role="option"]');
        this.firstNameInput = page.locator('#firstName');
        this.lastNameInput = page.locator('#lastName');
        this.emailInput = page.locator('#email');
        this.phoneInput = page.locator('#phone');
        this.messageInput = page.locator('#message, textarea').first();
        this.submitButton = page.getByText('SUBMIT', { exact: true });
        this.attachmentErrorMessage = page.getByText('Your attachment file type is not supported.', { exact: false });
        this.thankYouHeading = page.getByText('Thank you', { exact: true });
        this.faqLink = page.locator('a[href="/faq/list"]');
    }
    async open() {
        await this.goto('/contact/eform');
        await this.waitForPageLoad();
        await this.closePopupIfPresent();
    }
    async openHelpRequestTab() {
        await this.closePopupIfPresent();
        await this.helpRequestTab.click();
    }
    async openFactivaSourceRequestTab() {
        await this.closePopupIfPresent();
        await this.factivaSourceRequestTab.click();
    }
    async openRcProfileUpdateTab() {
        await this.closePopupIfPresent();
        await this.rcProfileUpdateTab.click();
    }
    async selectProduct(productName) {
        await this.productCombobox.click();
        await this.dropdownOption.filter({ hasText: productName }).first().click();
    }
    async selectLanguage(languageName) {
        await this.languageCombobox.click();
        await this.dropdownOption.filter({ hasText: languageName }).first().click();
    }
    async getProductAreaOptions() {
        await this.productAreaCombobox.click();
        const options = await this.dropdownOption.allTextContents();
        await this.page.keyboard.press('Escape');
        return options;
    }
    async uploadAttachment(filePath) {
        await this.closePopupIfPresent();
        const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.addAttachmentButton.click()]);
        await chooser.setFiles(filePath);
        await this.page.waitForTimeout(1000);
    }
    async fillHelpRequest(fields) {
        await this.firstNameInput.fill(fields.firstName);
        await this.lastNameInput.fill(fields.lastName);
        await this.emailInput.fill(fields.email);
        await this.phoneInput.fill(fields.phone);
        await this.messageInput.fill(fields.message);
    }
    async clickSubmit() {
        await this.submitButton.click();
    }
    getFieldValue(fieldId) {
        return this.page.locator(`#${fieldId}`).inputValue();
    }
    async fillField(fieldId, value) {
        await this.page.locator(`#${fieldId}`).fill(value);
    }
}
exports.HelpRequestFormPage = HelpRequestFormPage;
