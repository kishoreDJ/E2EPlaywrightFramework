/**
 * DJCSS Factiva update notification pages, reached via Notifications -> "Factiva Content
 * Update" (-> /notifications/sources) or "Factiva Product Updates" (-> /notifications/FactivaProductUpdates).
 * Year/month selection uses custom combobox widgets (#year, #month), not native <select>s.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FactivaUpdatesPage extends BasePage {
  private readonly yearCombobox: Locator;
  private readonly monthCombobox: Locator;
  private readonly comboboxOption: Locator;

  constructor(page: Page) {
    super(page);
    this.yearCombobox = page.locator('#year');
    this.monthCombobox = page.locator('#month');
    this.comboboxOption = page.locator('[role="listbox"] li, [role="option"], ul li');
  }

  public async openContentUpdates(): Promise<void> {
    await this.clickNavLink('Notifications');
    await this.page.getByText('Factiva Content Update', { exact: true }).click();
    await this.waitForPageLoad();
  }

  public async openProductUpdates(): Promise<void> {
    await this.clickNavLink('Notifications');
    await this.page.getByText('Factiva Product Updates', { exact: true }).click();
    await this.waitForPageLoad();
  }

  public async hasYearOption(year: string): Promise<boolean> {
    await this.yearCombobox.click();
    await this.page.waitForTimeout(500);
    const options = await this.comboboxOption.allTextContents();
    return options.includes(year);
  }

  public async selectYear(year: string): Promise<void> {
    await this.yearCombobox.click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(year, { exact: true }).click();
    await this.page.waitForTimeout(1000);
  }

  public async selectMonth(month: string): Promise<void> {
    await this.monthCombobox.click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(month, { exact: true }).click();
    await this.page.waitForTimeout(1000);
  }

  public getArticleContent(title: string): Locator {
    return this.page.getByText(title, { exact: true });
  }
}
