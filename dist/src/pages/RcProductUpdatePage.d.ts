/**
 * R&C Product Update - https://customer.qa.dowjones.com/notifications/productUpdates
 * Reached via Notifications -> R&C Product Update in the top navigation.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class RcProductUpdatePage extends BasePage {
    private readonly riskJournalCheckbox;
    readonly riskJournalLabel: Locator;
    constructor(page: Page);
    open(): Promise<void>;
    isRiskJournalChecked(): Promise<boolean>;
    toggleRiskJournal(): Promise<void>;
}
//# sourceMappingURL=RcProductUpdatePage.d.ts.map