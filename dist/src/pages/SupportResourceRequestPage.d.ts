/**
 * Support Resource Request Form - https://customer.qa.dowjones.com/supportResourceRequest
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export declare class SupportResourceRequestPage extends BasePage {
    private readonly addAttachmentButton;
    readonly attachmentInput: Locator;
    constructor(page: Page);
    open(): Promise<void>;
    uploadViaFileChooser(filePath: string): Promise<void>;
    getSelectedFileCount(): Promise<number>;
}
//# sourceMappingURL=SupportResourceRequestPage.d.ts.map