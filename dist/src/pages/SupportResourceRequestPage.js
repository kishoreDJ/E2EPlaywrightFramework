"use strict";
/**
 * Support Resource Request Form - https://customer.qa.dowjones.com/supportResourceRequest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportResourceRequestPage = void 0;
const BasePage_1 = require("./BasePage");
class SupportResourceRequestPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.addAttachmentButton = page.getByText('ADD ATTACHMENT', { exact: true });
        this.attachmentInput = page.locator('#attachment');
    }
    async open() {
        await this.goto('/supportResourceRequest');
        await this.waitForPageLoad();
    }
    async uploadViaFileChooser(filePath) {
        const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.addAttachmentButton.click()]);
        await chooser.setFiles(filePath);
        await this.page.waitForTimeout(1000);
    }
    getSelectedFileCount() {
        return this.attachmentInput.evaluate((el) => el.files?.length ?? 0);
    }
}
exports.SupportResourceRequestPage = SupportResourceRequestPage;
