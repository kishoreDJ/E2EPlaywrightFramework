/**
 * Dow Jones Yomiuri Standalone Page - https://customer.qa.dowjones.com/dowjonesyomiuri
 * Reached via Contact Us -> Dowjones Yomiuri in the top navigation.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class YomiuriPage extends BasePage {
    readonly logo: Locator;
    constructor(page: Page);
    open(): Promise<void>;
}
//# sourceMappingURL=YomiuriPage.d.ts.map