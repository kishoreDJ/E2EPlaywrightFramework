/**
 * Live Chat Page - https://customer.qa.dowjones.com/contact/liveChat
 * Reached via Contact Us -> Live Chat in the top navigation.
 */
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class LiveChatPage extends BasePage {
    private readonly firstNameInput;
    private readonly lastNameInput;
    private readonly emailInput;
    private readonly countryButton;
    private readonly phoneInput;
    private readonly productLineCombobox;
    private readonly productAreaCombobox;
    private readonly languageCombobox;
    private readonly messageInput;
    private readonly startChatButton;
    private readonly attentionOverlayCloseButton;
    private readonly dropdownOption;
    constructor(page: Page);
    open(): Promise<void>;
    dismissAttentionOverlayIfPresent(): Promise<void>;
    fillContactDetails(details: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        message?: string;
    }): Promise<void>;
    selectCountry(countryName: string): Promise<void>;
    selectProductLine(productLineName: string): Promise<void>;
    selectProductArea(productAreaName: string): Promise<void>;
    selectLanguage(languageName: string): Promise<void>;
    getLanguageOptions(): Promise<string[]>;
    getProductAreaOptions(): Promise<string[]>;
    clickStartChat(): Promise<void>;
    getSelectedLanguage(): Promise<string>;
    getSelectedProductArea(): Promise<string>;
    getValidationErrors(): Promise<string[]>;
}
//# sourceMappingURL=LiveChatPage.d.ts.map