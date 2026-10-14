"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackFormPage = void 0;
const BasePage_1 = require("./BasePage");
class FeedbackFormPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.firstNameInput = page.locator('#firstName');
        this.lastNameInput = page.locator('#lastName');
        this.emailInput = page.locator('#email');
        this.productDropdown = page.locator('[role="combobox"]').first();
        this.messageTextarea = page.locator('#message');
        this.addAttachmentButton = page.getByText('ADD ATTACHMENT', { exact: true });
        this.attachmentInput = page.locator('#attachment');
        this.submitButton = page.getByText('SUBMIT', { exact: true });
        this.successMessage = page.getByText('Thank you for your feedback.');
        this.firstNameError = page.getByText('Please enter your first name');
        this.lastNameError = page.getByText('Please enter your last name');
        this.emailError = page.getByText('Please enter a valid email');
        this.messageError = page.getByText('Please enter a valid message');
        this.genericErrorMessage = page.getByText('There was an error processing your request');
    }
    async openForSlug(slug) {
        await this.goto(`/feedback/${slug}`);
        await this.waitForPageLoad();
        await this.closePopupIfPresent();
    }
    async fillForm(fields) {
        if (fields.firstName !== undefined)
            await this.firstNameInput.fill(fields.firstName);
        if (fields.lastName !== undefined)
            await this.lastNameInput.fill(fields.lastName);
        if (fields.email !== undefined)
            await this.emailInput.fill(fields.email);
        if (fields.message !== undefined)
            await this.messageTextarea.fill(fields.message);
        if (fields.product !== undefined)
            await this.selectProduct(fields.product);
    }
    async selectProduct(optionText) {
        await this.productDropdown.click();
        await this.page.getByRole('option', { name: optionText, exact: true }).click();
    }
    async uploadFiles(filePaths) {
        await this.closePopupIfPresent();
        const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.addAttachmentButton.click()]);
        await chooser.setFiles(filePaths);
        await this.page.waitForTimeout(1000);
    }
    async clickSubmit() {
        await this.submitButton.click();
    }
    hasProductDropdown() {
        return this.page.locator('[role="combobox"]').count().then((count) => count > 0);
    }
}
exports.FeedbackFormPage = FeedbackFormPage;
