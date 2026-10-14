"use strict";
/**
 * FAQ Page - https://customer.qa.dowjones.com/faq/list
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqPage = void 0;
const BasePage_1 = require("./BasePage");
class FaqPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.searchInput = page.locator('input[placeholder="Type something"]');
        this.acceptTermsButton = page.getByText('ACCEPT', { exact: true });
        this.resultsCountText = page.getByText(/Results? [Ff]ound/);
        this.noResultsContactUsLink = page.getByText('Contact us', { exact: true });
    }
    async open() {
        await this.clickNavLink('FAQ');
    }
    async search(term) {
        await this.searchInput.fill(term);
        await this.page.keyboard.press('Enter');
        await this.page.waitForURL(/searchTerm=/);
    }
    async openArticle(title) {
        await this.page.getByText(title, { exact: true }).first().click();
        await this.page.waitForURL(/\/faq\/list\//);
    }
    async goToResultsPage(pageNumber) {
        await this.page.getByText(String(pageNumber), { exact: true }).first().click();
        await this.page.waitForURL(/offset=/);
    }
    getResultsCountText() {
        return this.resultsCountText.textContent();
    }
}
exports.FaqPage = FaqPage;
