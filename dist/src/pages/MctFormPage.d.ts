import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export interface MctFormFields {
    yourName?: string;
    email?: string;
    headlineTitle?: string;
    publicationName?: string;
    publicationDate?: string;
    urlToLinkTo?: string;
    comments?: string;
    optIn?: boolean;
}
export declare class MctFormPage extends BasePage {
    private readonly yourNameInput;
    private readonly emailInput;
    private readonly headlineTitleInput;
    private readonly publicationNameInput;
    private readonly publicationDateInput;
    private readonly urlToLinkToInput;
    private readonly uploadFileInput;
    private readonly commentsTextarea;
    private readonly optInCheckbox;
    private readonly submitButton;
    private readonly fieldLabels;
    readonly uploadHelperText: Locator;
    readonly successMessage: Locator;
    readonly genericErrorMessage: Locator;
    private readonly selectedFileNames;
    constructor(page: Page);
    openForCompany(companySlug: string): Promise<void>;
    fillForm(fields: MctFormFields): Promise<void>;
    uploadFiles(filePaths: string[]): Promise<void>;
    clickSubmit(): Promise<void>;
    /** Counts POSTs to the form submission endpoint made after this call, to detect duplicate submissions. */
    countSubmissionRequests(): {
        get: () => number;
    };
    getFieldLabelTexts(): Promise<string[]>;
    getInlineErrorMessages(): Promise<string[]>;
    getSelectedFileCountText(): Promise<string | null>;
}
//# sourceMappingURL=MctFormPage.d.ts.map