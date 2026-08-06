/**
 * Support Resource Request Form - https://customer.qa.dowjones.com/supportResourceRequest
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SupportResourceRequestPage extends BasePage {
  private readonly addAttachmentButton: Locator;
  public readonly attachmentInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addAttachmentButton = page.getByText('ADD ATTACHMENT', { exact: true });
    this.attachmentInput = page.locator('#attachment');
  }

  public async open(): Promise<void> {
    await this.goto('/supportResourceRequest');
    await this.waitForPageLoad();
  }

  public async uploadViaFileChooser(filePath: string): Promise<void> {
    const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), this.addAttachmentButton.click()]);
    await chooser.setFiles(filePath);
  }

  public getSelectedFileCount(): Promise<number> {
    return this.attachmentInput.evaluate((el: HTMLInputElement) => el.files?.length ?? 0);
  }
}
