"use strict";
/**
 * Dow Jones Yomiuri Standalone Page - https://customer.qa.dowjones.com/dowjonesyomiuri
 * Reached via Contact Us -> Dowjones Yomiuri in the top navigation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.YomiuriPage = void 0;
const BasePage_1 = require("./BasePage");
class YomiuriPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.logo = page.locator('img[src*="djy-logo"]');
    }
    async open() {
        await this.goto('/dowjonesyomiuri');
        await this.waitForPageLoad();
    }
}
exports.YomiuriPage = YomiuriPage;
