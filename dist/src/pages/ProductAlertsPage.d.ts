import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class ProductAlertsPage extends BasePage {
    private readonly heading;
    constructor(page: Page);
    open(): Promise<void>;
    getFilterCheckbox(productName: string): Locator;
    getProductNames(): string[];
    getProductLabel(productName: string): Locator;
}
//# sourceMappingURL=ProductAlertsPage.d.ts.map