/**
 * R&C Product Update - https://customer.qa.dowjones.com/notifications/productUpdates
 * Reached via Notifications -> R&C Product Update in the top navigation.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RcProductUpdatePage extends BasePage {
  private readonly riskJournalCheckbox: Locator;
  public readonly riskJournalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.riskJournalCheckbox = page.locator('input#Dow\\ Jones\\ Risk\\ Journal[type="checkbox"]');
    this.riskJournalLabel = page.getByText('Dow Jones Risk Journal', { exact: true });
  }

  public async open(): Promise<void> {
    await this.clickNavLink('Notifications');
    await this.page.getByText('R&C Product Update', { exact: true }).click();
    await this.waitForPageLoad();
  }

  public isRiskJournalChecked(): Promise<boolean> {
    return this.riskJournalCheckbox.isChecked();
  }

  public async toggleRiskJournal(): Promise<void> {
    await this.riskJournalLabel.click();
  }
}
