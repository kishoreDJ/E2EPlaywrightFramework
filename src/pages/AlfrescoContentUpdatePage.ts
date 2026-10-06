/**
 * Alfresco Share - create + publish product/content update articles.
 * Flow: navigate to the type's folder -> create/open a year subfolder -> create the
 * article via the type's "Create" menu item -> go back to the type's folder (one level
 * above the year subfolder) and use "Publish Update" with matching type/month/year.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ContentUpdateType {
  /** Folder names to click through from the document library root, down to (not including) the year folder. */
  folderPath: string[];
  /** Exact text of the item in the "Create" dropdown used to create this article type. */
  createMenuLabel: string;
  /** Form field name of the month <select> on the create-content form. */
  monthFieldName: string;
  /** Form field name of the year <input> on the create-content form. */
  yearFieldName: string;
  /** Label used for this type in the "Publish Update" dialog's type dropdown. */
  publishTypeLabel: string;
}

export const CONTENT_UPDATE_TYPES: Record<string, ContentUpdateType> = {
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

export class AlfrescoContentUpdatePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async openDocumentLibraryRoot(): Promise<void> {
    await this.goto(process.env.ALFRESCO_BASE_URL + 'share/page/site/djcss/documentlibrary');
    await this.waitForPageLoad();
  }

  private async openCreateMenu(): Promise<void> {
    await this.page.locator('button:has-text("Create"), a:has-text("Create")').first().click();
    await this.page.waitForTimeout(400);
  }

  /** Navigates from the document library root through each folder name in order. */
  public async navigateToFolder(folderPath: string[]): Promise<void> {
    await this.openDocumentLibraryRoot();
    for (const folderName of folderPath) {
      await this.page.locator('.filename a', { hasText: folderName }).click();
      await this.page.waitForTimeout(1000);
    }
  }

  public async createYearFolderIfMissing(folderPath: string[], year: string): Promise<void> {
    await this.navigateToFolder(folderPath);
    const alreadyExists = await this.page.locator('.filename a', { hasText: year }).count();
    if (alreadyExists > 0) return;

    await this.openCreateMenu();
    await this.page.getByText('Folder', { exact: true }).click();
    await this.page.waitForTimeout(800);
    const nameInput = this.page.locator('text=Name:').locator('..').locator('input').first();
    await nameInput.fill(year);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(1200);
  }

  public async createArticle(
    type: ContentUpdateType,
    year: string,
    month: string,
    title: string,
    content: string,
  ): Promise<void> {
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

  public async publishUpdate(type: ContentUpdateType, month: string, year: string): Promise<void> {
    await this.navigateToFolder(type.folderPath);
    await this.page.getByText('Publish Update', { exact: true }).click();
    await this.page.waitForTimeout(1000);

    await this.page.selectOption('#publish-type', { label: type.publishTypeLabel });
    await this.page.selectOption('#publish-month', { label: month });
    await this.page.fill('#publish-year', year);

    await this.page.getByRole('button', { name: 'Publish', exact: true }).click();
    await this.page.waitForTimeout(2000);
  }

  public getPublishSuccessMessage(type: ContentUpdateType, month: string, year: string): Locator {
    return this.page.getByText(`${type.publishTypeLabel} for ${month} ${year} published successfully.`);
  }

  /** Idempotent - safe to call even if the year folder was already removed or never created. */
  public async deleteYearFolder(folderPath: string[], year: string): Promise<void> {
    await this.navigateToFolder(folderPath);
    const row = this.page.locator('.filename a', { hasText: year }).first();
    if ((await row.count()) === 0) return;

    const container = row.locator('xpath=ancestor::tr[1]');
    await container.locator('input[type="checkbox"]').check({ force: true });
    await this.page.waitForTimeout(500);

    await this.page.locator('a:has-text("Selected Items"), button:has-text("Selected Items")').first().click();
    await this.page.waitForTimeout(400);
    await this.page.getByText('Delete', { exact: true }).click();
    await this.page.waitForTimeout(800);

    const confirmButton = this.page.getByRole('button', { name: 'Delete', exact: true });
    if ((await confirmButton.count()) > 0) await confirmButton.click();
    await this.page.waitForTimeout(1500);
  }
}
