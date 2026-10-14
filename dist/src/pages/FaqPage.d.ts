/**
 * FAQ Page - https://customer.qa.dowjones.com/faq/list
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class FaqPage extends BasePage {
    private readonly searchInput;
    readonly acceptTermsButton: Locator;
    readonly resultsCountText: Locator;
    readonly noResultsContactUsLink: Locator;
    constructor(page: Page);
    open(): Promise<void>;
    search(term: string): Promise<void>;
    openArticle(title: string): Promise<void>;
    goToResultsPage(pageNumber: number): Promise<void>;
    getResultsCountText(): Promise<string | null>;
}
//# sourceMappingURL=FaqPage.d.ts.map