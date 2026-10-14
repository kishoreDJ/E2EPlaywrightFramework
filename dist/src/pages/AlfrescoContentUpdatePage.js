"use strict";
/**
 * Alfresco Share - create + publish product/content update articles.
 * Flow: navigate to the type's folder -> create/open a year subfolder -> create the
 * article via the type's "Create" menu item -> go back to the type's folder (one level
 * above the year subfolder) and use "Publish Update" with matching type/month/year.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlfrescoContentUpdatePage = exports.CONTENT_UPDATE_TYPES = void 0;
const BasePage_1 = require("./BasePage");
exports.CONTENT_UPDATE_TYPES = {
    FACTIVA_CONTENT_UPDATE: {
        folderPath: ['Factiva Content Updates', 'Content Updates'],
        createMenuLabel: 'Factiva Content Update',
        monthFieldName: 'prop_djcss_factivaContentUpdateMonth',
        yearFieldName: 'prop_djcss_factivaContentUpdateYear',
        publishTypeLabel: 'Factiva Content Update',
    },
    FACTIVA_PRODUCT_UPDATE: {
        folderPath: ['Whats New in Factiva'],
        createMenuLabel: 'Factiva Product Update',
        monthFieldName: 'prop_djcss_whatsNewInFactivaMonth',
        yearFieldName: 'prop_djcss_whatsNewInFactivaYear',
        publishTypeLabel: 'Factiva Product Update',
    },
    NEWSWIRE_PRODUCT_UPDATE: {
        folderPath: ['Newswire Product Updates'],
        createMenuLabel: 'Product Update Template',
        monthFieldName: 'prop_djcss_whatsNewInFactivaMonth',
        yearFieldName: 'prop_djcss_whatsNewInFactivaYear',
        publishTypeLabel: 'Newswire Product Update',
    },
    IMS_PRODUCT_UPDATE: {
        folderPath: ['IMS Product Update'],
        createMenuLabel: 'Product Update Template',
        monthFieldName: 'prop_djcss_whatsNewInFactivaMonth',
        yearFieldName: 'prop_djcss_whatsNewInFactivaYear',
        publishTypeLabel: 'IMS Product Update',
    },
};
class AlfrescoContentUpdatePage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
    }
    async openDocumentLibraryRoot() {
        await this.goto(process.env.ALFRESCO_BASE_URL + 'share/page/site/djcss/documentlibrary');
        await this.waitForPageLoad();
    }
    async openCreateMenu() {
        await this.page.locator('button:has-text("Create"), a:has-text("Create")').first().click();
        await this.page.waitForTimeout(400);
    }
    /** Navigates from the document library root through each folder name in order. */
    async navigateToFolder(folderPath) {
        await this.openDocumentLibraryRoot();
        for (const folderName of folderPath) {
            await this.page.locator('.filename a', { hasText: folderName }).click();
            await this.page.waitForTimeout(1000);
        }
    }
    async createYearFolderIfMissing(folderPath, year) {
        await this.navigateToFolder(folderPath);
        const alreadyExists = await this.page.locator('.filename a', { hasText: year }).count();
        if (alreadyExists > 0)
            return;
        await this.openCreateMenu();
        await this.page.getByText('Folder', { exact: true }).click();
        await this.page.waitForTimeout(800);
        const nameInput = this.page.locator('text=Name:').locator('..').locator('input').first();
        await nameInput.fill(year);
        await this.page.getByRole('button', { name: 'Save' }).click();
        await this.page.waitForTimeout(1200);
    }
    async createArticle(type, year, month, title, content) {
        await this.navigateToFolder(type.folderPath);
        await this.page.locator('.filename a', { hasText: year }).first().click();
        await this.page.waitForTimeout(1000);
        await this.openCreateMenu();
        await this.page.getByText(type.createMenuLabel, { exact: true }).click();
        await this.page.waitForTimeout(1200);
        await this.page.fill('input[name="prop_cm_title"]', title);
        await this.page.locator('iframe').first().contentFrame().locator('#tinymce').fill(content);
        await this.page.selectOption(`select[name="${type.monthFieldName}"]`, { label: month });
        await this.page.fill(`input[name="${type.yearFieldName}"]`, year);
        await this.page.click('button:has-text("Create")');
        await this.page.waitForTimeout(2000);
    }
    async publishUpdate(type, month, year) {
        await this.navigateToFolder(type.folderPath);
        await this.page.getByText('Publish Update', { exact: true }).click();
        await this.page.waitForTimeout(1000);
        await this.page.selectOption('#publish-type', { label: type.publishTypeLabel });
        await this.page.selectOption('#publish-month', { label: month });
        await this.page.fill('#publish-year', year);
        await this.page.getByRole('button', { name: 'Publish', exact: true }).click();
        await this.page.waitForTimeout(2000);
    }
    getPublishSuccessMessage(type, month, year) {
        return this.page.getByText(`${type.publishTypeLabel} for ${month} ${year} published successfully.`);
    }
    /** Idempotent - safe to call even if the year folder was already removed or never created. */
    async deleteYearFolder(folderPath, year) {
        await this.navigateToFolder(folderPath);
        const row = this.page.locator('.filename a', { hasText: year }).first();
        if ((await row.count()) === 0)
            return;
        const container = row.locator('xpath=ancestor::tr[1]');
        await container.locator('input[type="checkbox"]').check({ force: true });
        await this.page.waitForTimeout(500);
        await this.page.locator('a:has-text("Selected Items"), button:has-text("Selected Items")').first().click();
        await this.page.waitForTimeout(400);
        await this.page.getByText('Delete', { exact: true }).click();
        await this.page.waitForTimeout(800);
        const confirmButton = this.page.getByRole('button', { name: 'Delete', exact: true });
        if ((await confirmButton.count()) > 0)
            await confirmButton.click();
        await this.page.waitForTimeout(1500);
    }
}
exports.AlfrescoContentUpdatePage = AlfrescoContentUpdatePage;
