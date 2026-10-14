/**
 * Alfresco Share - create + publish product/content update articles.
 * Flow: navigate to the type's folder -> create/open a year subfolder -> create the
 * article via the type's "Create" menu item -> go back to the type's folder (one level
 * above the year subfolder) and use "Publish Update" with matching type/month/year.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export interface ContentUpdateType {
    /** Folder names to click through from the document library root, down to (not including) the year folder. */
    folderPath: string[];
    /** Exact text of the item in the "Create" dropdown used to create this article type. */
    createMenuLabel: string;
    /** Form field name of the month <select> on the create-content form. */
    monthFieldName: string;
    /** Form field name of the year <input> on the create-content form. */
    yearFieldName: string;
    /** Label used for this type in the "Publish Update" dialog's type dropdown. */
    publishTypeLabel: string;
}
export declare const CONTENT_UPDATE_TYPES: Record<string, ContentUpdateType>;
export declare class AlfrescoContentUpdatePage extends BasePage {
    constructor(page: Page);
    private openDocumentLibraryRoot;
    private openCreateMenu;
    /** Navigates from the document library root through each folder name in order. */
    navigateToFolder(folderPath: string[]): Promise<void>;
    createYearFolderIfMissing(folderPath: string[], year: string): Promise<void>;
    createArticle(type: ContentUpdateType, year: string, month: string, title: string, content: string): Promise<void>;
    publishUpdate(type: ContentUpdateType, month: string, year: string): Promise<void>;
    getPublishSuccessMessage(type: ContentUpdateType, month: string, year: string): Locator;
    /** Idempotent - safe to call even if the year folder was already removed or never created. */
    deleteYearFolder(folderPath: string[], year: string): Promise<void>;
}
//# sourceMappingURL=AlfrescoContentUpdatePage.d.ts.map