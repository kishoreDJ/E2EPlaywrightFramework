import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

const PRODUCT_NAMES = [
  'Factiva',
  'Risk & Compliance',
  'Dragonfly',
  'Oxford Analytica',
  'Global Risk Monitor',
  'Preview',
];

export class ProductAlertsPage extends BasePage {
  private readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Product Alerts' });
  }

  public async open(): Promise<void> {
    await this.goto('/notifications');
    await this.waitForPageLoad();
  }

  public getFilterCheckbox(productName: string): Locator {
    return this.page.getByRole('checkbox', { name: productName, exact: true });
  }

  public getProductNames(): string[] {
    return PRODUCT_NAMES;
  }

  public getProductLabel(productName: string): Locator {
    return this.page.getByText(productName, { exact: true });
  }
}
