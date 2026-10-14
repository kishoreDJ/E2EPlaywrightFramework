/**
 * Base Page - shared navigation and wait helpers for all page objects
 */
import { Page } from '@playwright/test';
import { Logger } from '../utils/logger';
export declare class BasePage {
    protected readonly page: Page;
    protected readonly log: Logger;
    constructor(page: Page);
    goto(path?: string): Promise<void>;
    waitForPageLoad(): Promise<void>;
    getTitle(): Promise<string>;
    getUrl(): string;
    clickNavLink(linkText: string): Promise<void>;
    /** Closes an overlay/modal if one happens to be visible, otherwise no-ops. */
    closePopupIfPresent(closeButtonText?: string): Promise<void>;
}
//# sourceMappingURL=BasePage.d.ts.map