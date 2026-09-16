import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdministrationPage extends BasePage {
  private readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Invoices & Reports' });
  }

  public async open(): Promise<void> {
    await this.goto('/administration');
    await this.waitForPageLoad();
  }

  public getHeading(): Locator {
    return this.heading;
  }
}
