import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class HomePage extends BasePage {
    readonly headerLogo: Locator;
    readonly footerLogo: Locator;
    private readonly advancedSearchToggle;
    private readonly searchButton;
    constructor(page: Page);
    getFaviconHref(): Promise<string | null>;
    openAdvancedSearch(): Promise<void>;
    selectProductFilter(productName: string): Promise<void>;
    clickSearch(): Promise<void>;
}
//# sourceMappingURL=HomePage.d.ts.map