"use strict";
/**
 * DJCSS Factiva update notification pages, reached via Notifications -> "Factiva Content
 * Update" (-> /notifications/sources) or "Factiva Product Updates" (-> /notifications/FactivaProductUpdates).
 * Year/month selection uses custom combobox widgets (#year, #month), not native <select>s.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactivaUpdatesPage = void 0;
const BasePage_1 = require("./BasePage");
class FactivaUpdatesPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.yearCombobox = page.locator('#year');
        this.monthCombobox = page.locator('#month');
        this.comboboxOption = page.locator('[role="listbox"] li, [role="option"], ul li');
    }
    async openContentUpdates() {
        await this.clickNavLink('Notifications');
        await this.page.getByText('Factiva Content Update', { exact: true }).click();
        await this.waitForPageLoad();
    }
    async openProductUpdates() {
        await this.clickNavLink('Notifications');
        await this.page.getByText('Factiva Product Updates', { exact: true }).click();
        await this.waitForPageLoad();
    }
    async hasYearOption(year) {
        await this.yearCombobox.click();
        await this.page.waitForTimeout(500);
        const options = await this.comboboxOption.allTextContents();
        return options.includes(year);
    }
    async selectYear(year) {
        await this.yearCombobox.click();
        await this.page.waitForTimeout(500);
        await this.page.getByText(year, { exact: true }).click();
        await this.page.waitForTimeout(1000);
    }
    async selectMonth(month) {
        await this.monthCombobox.click();
        await this.page.waitForTimeout(500);
        await this.page.getByText(month, { exact: true }).click();
        await this.page.waitForTimeout(1000);
    }
    getArticleContent(title) {
        return this.page.getByText(title, { exact: true });
    }
}
exports.FactivaUpdatesPage = FactivaUpdatesPage;
