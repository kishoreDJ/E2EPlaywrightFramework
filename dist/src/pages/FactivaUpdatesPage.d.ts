/**
 * DJCSS Factiva update notification pages, reached via Notifications -> "Factiva Content
 * Update" (-> /notifications/sources) or "Factiva Product Updates" (-> /notifications/FactivaProductUpdates).
 * Year/month selection uses custom combobox widgets (#year, #month), not native <select>s.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class FactivaUpdatesPage extends BasePage {
    private readonly yearCombobox;
    private readonly monthCombobox;
    private readonly comboboxOption;
    constructor(page: Page);
    openContentUpdates(): Promise<void>;
    openProductUpdates(): Promise<void>;
    hasYearOption(year: string): Promise<boolean>;
    selectYear(year: string): Promise<void>;
    selectMonth(month: string): Promise<void>;
    getArticleContent(title: string): Locator;
}
//# sourceMappingURL=FactivaUpdatesPage.d.ts.map