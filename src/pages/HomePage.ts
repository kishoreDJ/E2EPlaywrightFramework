import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  public readonly headerLogo: Locator;
  public readonly footerLogo: Locator;
  private readonly advancedSearchToggle: Locator;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.headerLogo = page.getByAltText('DJCSS Logo');
    this.footerLogo = page.locator('footer img');
    this.advancedSearchToggle = page.getByText('Advanced search', { exact: false }).first();
    this.searchButton = page.getByText('Search', { exact: true });
  }

  public getFaviconHref(): Promise<string | null> {
    return this.page.locator('link[rel="icon"]').first().getAttribute('href');
  }

  public async openAdvancedSearch(): Promise<void> {
    await this.advancedSearchToggle.click();
  }

  public async selectProductFilter(productName: string): Promise<void> {
    await this.page.locator(`[role="checkbox"][aria-label="${productName}"]`).click();
  }

  public async clickSearch(): Promise<void> {
    await this.searchButton.click();
    await this.waitForPageLoad();
  }
}
