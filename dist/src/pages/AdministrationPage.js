"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdministrationPage = void 0;
const BasePage_1 = require("./BasePage");
class AdministrationPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Invoices & Reports' });
    }
    async open() {
        await this.goto('/administration');
        await this.waitForPageLoad();
    }
    getHeading() {
        return this.heading;
    }
}
exports.AdministrationPage = AdministrationPage;
