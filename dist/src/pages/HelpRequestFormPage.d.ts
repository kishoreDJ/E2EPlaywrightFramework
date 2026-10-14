/**
 * Help Request Form - https://customer.qa.dowjones.com/contact/eform
 * Tabbed form: Help Request, Factiva Source Request, R&C profile update.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class HelpRequestFormPage extends BasePage {
    private readonly helpRequestTab;
    private readonly factivaSourceRequestTab;
    private readonly rcProfileUpdateTab;
    private readonly addAttachmentButton;
    private readonly attachmentInput;
    private readonly productCombobox;
    private readonly productAreaCombobox;
    private readonly languageCombobox;
    private readonly dropdownOption;
    private readonly firstNameInput;
    private readonly lastNameInput;
    private readonly emailInput;
    private readonly phoneInput;
    private readonly messageInput;
    private readonly submitButton;
    readonly attachmentErrorMessage: Locator;
    readonly thankYouHeading: Locator;
    readonly faqLink: Locator;
    constructor(page: Page);
    open(): Promise<void>;
    openHelpRequestTab(): Promise<void>;
    openFactivaSourceRequestTab(): Promise<void>;
    openRcProfileUpdateTab(): Promise<void>;
    selectProduct(productName: string): Promise<void>;
    selectLanguage(languageName: string): Promise<void>;
    getProductAreaOptions(): Promise<string[]>;
    uploadAttachment(filePath: string): Promise<void>;
    fillHelpRequest(fields: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        message: string;
    }): Promise<void>;
    clickSubmit(): Promise<void>;
    getFieldValue(fieldId: string): Promise<string>;
    fillField(fieldId: string, value: string): Promise<void>;
}
//# sourceMappingURL=HelpRequestFormPage.d.ts.map