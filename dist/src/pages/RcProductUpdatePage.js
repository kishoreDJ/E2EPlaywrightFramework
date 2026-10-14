"use strict";
/**
 * R&C Product Update - https://customer.qa.dowjones.com/notifications/productUpdates
 * Reached via Notifications -> R&C Product Update in the top navigation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RcProductUpdatePage = void 0;
const BasePage_1 = require("./BasePage");
class RcProductUpdatePage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.riskJournalCheckbox = page.locator('input#Dow\\ Jones\\ Risk\\ Journal[type="checkbox"]');
        this.riskJournalLabel = page.getByText('Dow Jones Risk Journal', { exact: true });
    }
    async open() {
        await this.clickNavLink('Notifications');
        await this.page.getByText('R&C Product Update', { exact: true }).click();
        await this.waitForPageLoad();
    }
    isRiskJournalChecked() {
        return this.riskJournalCheckbox.isChecked();
    }
    async toggleRiskJournal() {
        await this.riskJournalLabel.click();
    }
}
exports.RcProductUpdatePage = RcProductUpdatePage;
