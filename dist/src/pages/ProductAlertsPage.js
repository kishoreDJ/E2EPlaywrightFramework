"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAlertsPage = void 0;
const BasePage_1 = require("./BasePage");
const PRODUCT_NAMES = [
    'Factiva',
    'Risk & Compliance',
    'Dragonfly',
    'Oxford Analytica',
    'Global Risk Monitor',
    'Preview',
];
class ProductAlertsPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Product Alerts' });
    }
    async open() {
        await this.goto('/notifications');
        await this.waitForPageLoad();
    }
    getFilterCheckbox(productName) {
        return this.page.getByRole('checkbox', { name: productName, exact: true });
    }
    getProductNames() {
        return PRODUCT_NAMES;
    }
    getProductLabel(productName) {
        return this.page.getByText(productName, { exact: true });
    }
}
exports.ProductAlertsPage = ProductAlertsPage;
