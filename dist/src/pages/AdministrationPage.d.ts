import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class AdministrationPage extends BasePage {
    private readonly heading;
    constructor(page: Page);
    open(): Promise<void>;
    getHeading(): Locator;
}
//# sourceMappingURL=AdministrationPage.d.ts.map