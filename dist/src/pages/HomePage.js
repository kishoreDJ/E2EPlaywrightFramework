"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePage = void 0;
const BasePage_1 = require("./BasePage");
class HomePage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.headerLogo = page.getByAltText('DJCSS Logo');
        this.footerLogo = page.locator('footer img');
        this.advancedSearchToggle = page.getByText('Advanced search', { exact: false }).first();
        this.searchButton = page.getByText('Search', { exact: true });
    }
    getFaviconHref() {
        return this.page.locator('link[rel="icon"]').first().getAttribute('href');
    }
    async openAdvancedSearch() {
        await this.advancedSearchToggle.click();
    }
    async selectProductFilter(productName) {
        await this.page.locator(`[role="checkbox"][aria-label="${productName}"]`).click();
    }
    async clickSearch() {
        await this.searchButton.click();
        await this.waitForPageLoad();
    }
}
exports.HomePage = HomePage;
