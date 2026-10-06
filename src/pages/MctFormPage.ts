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

export class MctFormPage extends BasePage {
  private readonly yourNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly headlineTitleInput: Locator;
  private readonly publicationNameInput: Locator;
  private readonly publicationDateInput: Locator;
  private readonly urlToLinkToInput: Locator;
  private readonly uploadFileInput: Locator;
  private readonly commentsTextarea: Locator;
  private readonly optInCheckbox: Locator;
  private readonly submitButton: Locator;
  private readonly fieldLabels: Locator;
  public readonly uploadHelperText: Locator;
  public readonly successMessage: Locator;
  public readonly genericErrorMessage: Locator;
  private readonly selectedFileNames: Locator;

  constructor(page: Page) {
    super(page);
    this.yourNameInput = page.locator('#your_name');
    this.emailInput = page.locator('#ccemail_input');
    this.headlineTitleInput = page.locator('#headline_title');
    this.publicationNameInput = page.locator('#publication_name');
    this.publicationDateInput = page.locator('#publication_date');
    this.urlToLinkToInput = page.locator('#url_to_link_to');
    this.uploadFileInput = page.locator('#upload_file');
    this.commentsTextarea = page.locator('#comments');
    this.optInCheckbox = page.locator('#confirm');
    this.submitButton = page.locator('button:has-text("Submit"), input[value="Submit"]');
    this.fieldLabels = page.locator('form label');
    this.uploadHelperText = page.getByText('Maximum 3 files allowed');
    this.successMessage = page.getByText('Thank you for your submission!');
    this.genericErrorMessage = page.getByText('An error occurred. Please try again.');
    this.selectedFileNames = page.locator('form').getByText(/\.\w+$/);
  }

  public async openForCompany(companySlug: string): Promise<void> {
    await this.goto(`/product-mycompanytoday/${companySlug}`);
    await this.waitForPageLoad();
  }

  public async fillForm(fields: MctFormFields): Promise<void> {
    if (fields.yourName !== undefined) await this.yourNameInput.fill(fields.yourName);
    if (fields.email !== undefined) await this.emailInput.fill(fields.email);
    if (fields.headlineTitle !== undefined) await this.headlineTitleInput.fill(fields.headlineTitle);
    if (fields.publicationName !== undefined) await this.publicationNameInput.fill(fields.publicationName);
    if (fields.publicationDate !== undefined) await this.publicationDateInput.fill(fields.publicationDate);
    if (fields.urlToLinkTo !== undefined) await this.urlToLinkToInput.fill(fields.urlToLinkTo);
    if (fields.comments !== undefined) await this.commentsTextarea.fill(fields.comments);
    if (fields.optIn) await this.optInCheckbox.check();
  }

  public async uploadFiles(filePaths: string[]): Promise<void> {
    await this.uploadFileInput.setInputFiles(filePaths);
  }

  public async clickSubmit(): Promise<void> {
    await this.submitButton.first().click();
  }

  /** Counts POSTs to the form submission endpoint made after this call, to detect duplicate submissions. */
  public countSubmissionRequests(): { get: () => number } {
    let count = 0;
    this.page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('myCompanyTodayForm')) {
        count += 1;
      }
    });
    return { get: () => count };
  }

  public async getFieldLabelTexts(): Promise<string[]> {
    return (await this.fieldLabels.allTextContents()).map((t) => t.trim()).filter((t) => t.length > 0);
  }

  public getInlineErrorMessages(): Promise<string[]> {
    return this.page
      .getByText('This field is required.')
      .allTextContents();
  }

  public getSelectedFileCountText(): Promise<string | null> {
    return this.page.getByText(/\d+ of \d+ files selected/).textContent();
  }
}
