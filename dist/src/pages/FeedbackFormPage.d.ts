import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export interface FeedbackFormFields {
    firstName?: string;
    lastName?: string;
    email?: string;
    product?: string;
    message?: string;
}
export declare class FeedbackFormPage extends BasePage {
    private readonly firstNameInput;
    private readonly lastNameInput;
    private readonly emailInput;
    private readonly productDropdown;
    private readonly messageTextarea;
    private readonly addAttachmentButton;
    private readonly attachmentInput;
    private readonly submitButton;
    readonly successMessage: Locator;
    readonly firstNameError: Locator;
    readonly lastNameError: Locator;
    readonly emailError: Locator;
    readonly messageError: Locator;
    readonly genericErrorMessage: Locator;
    constructor(page: Page);
    openForSlug(slug: string): Promise<void>;
    fillForm(fields: FeedbackFormFields): Promise<void>;
    selectProduct(optionText: string): Promise<void>;
    uploadFiles(filePaths: string[]): Promise<void>;
    clickSubmit(): Promise<void>;
    hasProductDropdown(): Promise<boolean>;
}
//# sourceMappingURL=FeedbackFormPage.d.ts.map