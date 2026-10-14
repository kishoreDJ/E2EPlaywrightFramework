"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MctFormPage = void 0;
const BasePage_1 = require("./BasePage");
class MctFormPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.yourNameInput = page.locator('#your_name');
        this.emailInput = page.locator('#ccemail_input');
        this.headlineTitleInput = page.locator('#headline_title');
        this.publicationNameInput = page.locator('#publication_name');
        this.publicationDateInput = page.locator('#publication_date');
        this.urlToLinkToInput = page.locator('#url_to_link_to');
        this.uploadFileInput = page.locator('#upload_file');
        this.commentsTextarea = page.locator('#comments');
        this.optInCheckbox = page.locator('#confirm');
        this.submitButton = page.locator('button:has-text("Submit"), input[value="Submit"]');
        this.fieldLabels = page.locator('form label');
        this.uploadHelperText = page.getByText('Maximum 3 files allowed');
        this.successMessage = page.getByText('Thank you for your submission!');
        this.genericErrorMessage = page.getByText('An error occurred. Please try again.');
        this.selectedFileNames = page.locator('form').getByText(/\.\w+$/);
    }
    async openForCompany(companySlug) {
        await this.goto(`/product-mycompanytoday/${companySlug}`);
        await this.waitForPageLoad();
    }
    async fillForm(fields) {
        if (fields.yourName !== undefined)
            await this.yourNameInput.fill(fields.yourName);
        if (fields.email !== undefined)
            await this.emailInput.fill(fields.email);
        if (fields.headlineTitle !== undefined)
            await this.headlineTitleInput.fill(fields.headlineTitle);
        if (fields.publicationName !== undefined)
            await this.publicationNameInput.fill(fields.publicationName);
        if (fields.publicationDate !== undefined)
            await this.publicationDateInput.fill(fields.publicationDate);
        if (fields.urlToLinkTo !== undefined)
            await this.urlToLinkToInput.fill(fields.urlToLinkTo);
        if (fields.comments !== undefined)
            await this.commentsTextarea.fill(fields.comments);
        if (fields.optIn)
            await this.optInCheckbox.check();
    }
    async uploadFiles(filePaths) {
        await this.uploadFileInput.setInputFiles(filePaths);
    }
    async clickSubmit() {
        await this.submitButton.first().click();
    }
    /** Counts POSTs to the form submission endpoint made after this call, to detect duplicate submissions. */
    countSubmissionRequests() {
        let count = 0;
        this.page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().includes('myCompanyTodayForm')) {
                count += 1;
            }
        });
        return { get: () => count };
    }
    async getFieldLabelTexts() {
        return (await this.fieldLabels.allTextContents()).map((t) => t.trim()).filter((t) => t.length > 0);
    }
    getInlineErrorMessages() {
        return this.page
            .getByText('This field is required.')
            .allTextContents();
    }
    getSelectedFileCountText() {
        return this.page.getByText(/\d+ of \d+ files selected/).textContent();
    }
}
exports.MctFormPage = MctFormPage;
