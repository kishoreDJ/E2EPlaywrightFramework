# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-chat/live-chat.spec.ts >> Live ChatDescription >> DJCSS-T165: Dragonfly Intelligence product name is updated in Live Chat form
- Location: tests/live-chat/live-chat.spec.ts:57:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
```

# Test source

```ts
  1   | /**
  2   |  * Live Chat Page - https://customer.qa.dowjones.com/contact/liveChat
  3   |  * Reached via Contact Us -> Live Chat in the top navigation.
  4   |  */
  5   | 
  6   | import { Page, Locator } from '@playwright/test';
  7   | import { BasePage } from './BasePage';
  8   | 
  9   | export class LiveChatPage extends BasePage {
  10  |   private readonly firstNameInput: Locator;
  11  |   private readonly lastNameInput: Locator;
  12  |   private readonly emailInput: Locator;
  13  |   private readonly countryButton: Locator;
  14  |   private readonly phoneInput: Locator;
  15  |   private readonly productLineCombobox: Locator;
  16  |   private readonly productAreaCombobox: Locator;
  17  |   private readonly languageCombobox: Locator;
  18  |   private readonly messageInput: Locator;
  19  |   private readonly startChatButton: Locator;
  20  |   private readonly attentionOverlayCloseButton: Locator;
  21  |   private readonly dropdownOption: Locator;
  22  | 
  23  |   constructor(page: Page) {
  24  |     super(page);
  25  |     this.firstNameInput = page.locator('#firstName');
  26  |     this.lastNameInput = page.locator('#lastName');
  27  |     this.emailInput = page.locator('#email');
  28  |     this.countryButton = page.locator('button[role="combobox"][aria-label="Country"]');
  29  |     this.phoneInput = page.locator('#phone');
  30  |     this.productLineCombobox = page.locator('[role="combobox"]', { has: page.locator('#productLine') });
  31  |     this.productAreaCombobox = page.locator('[role="combobox"]', { has: page.locator('#productArea') });
  32  |     this.languageCombobox = page.locator('[role="combobox"]', { has: page.locator('#language') });
  33  |     this.messageInput = page.locator('#message');
  34  |     this.startChatButton = page.getByText('START CHAT', { exact: false });
  35  |     this.attentionOverlayCloseButton = page.locator('.sc-qOiPt [role="button"]', { hasText: 'Close' });
  36  |     this.dropdownOption = page.locator('[role="option"]');
  37  |   }
  38  | 
  39  |   public async open(): Promise<void> {
  40  |     await this.clickNavLink('Contact Us');
  41  |     await this.page.getByText('Live Chat', { exact: true }).first().click();
  42  |     await this.waitForPageLoad();
  43  |     await this.dismissAttentionOverlayIfPresent();
  44  |   }
  45  | 
  46  |   public async dismissAttentionOverlayIfPresent(): Promise<void> {
  47  |     if (await this.attentionOverlayCloseButton.isVisible().catch(() => false)) {
> 48  |       await this.attentionOverlayCloseButton.click();
      |                                              ^ Error: locator.click: Target page, context or browser has been closed
  49  |     }
  50  |   }
  51  | 
  52  |   public async fillContactDetails(details: {
  53  |     firstName?: string;
  54  |     lastName?: string;
  55  |     email?: string;
  56  |     phone?: string;
  57  |     message?: string;
  58  |   }): Promise<void> {
  59  |     if (details.firstName) await this.firstNameInput.fill(details.firstName);
  60  |     if (details.lastName) await this.lastNameInput.fill(details.lastName);
  61  |     if (details.email) await this.emailInput.fill(details.email);
  62  |     if (details.phone) await this.phoneInput.fill(details.phone);
  63  |     if (details.message) await this.messageInput.fill(details.message);
  64  |   }
  65  | 
  66  |   public async selectCountry(countryName: string): Promise<void> {
  67  |     await this.countryButton.click();
  68  |     await this.dropdownOption.filter({ hasText: countryName }).first().click();
  69  |   }
  70  | 
  71  |   public async selectProductLine(productLineName: string): Promise<void> {
  72  |     await this.productLineCombobox.click();
  73  |     await this.dropdownOption.filter({ hasText: productLineName }).first().click();
  74  |   }
  75  | 
  76  |   public async selectProductArea(productAreaName: string): Promise<void> {
  77  |     await this.productAreaCombobox.click();
  78  |     await this.dropdownOption.filter({ hasText: productAreaName }).first().click();
  79  |   }
  80  | 
  81  |   public async selectLanguage(languageName: string): Promise<void> {
  82  |     await this.languageCombobox.click();
  83  |     await this.dropdownOption.filter({ hasText: languageName }).first().click();
  84  |   }
  85  | 
  86  |   public async getLanguageOptions(): Promise<string[]> {
  87  |     await this.languageCombobox.click();
  88  |     const options = await this.dropdownOption.allTextContents();
  89  |     await this.page.keyboard.press('Escape');
  90  |     return options;
  91  |   }
  92  | 
  93  |   public async getProductAreaOptions(): Promise<string[]> {
  94  |     await this.productAreaCombobox.click();
  95  |     const options = await this.dropdownOption.allTextContents();
  96  |     await this.page.keyboard.press('Escape');
  97  |     return options;
  98  |   }
  99  | 
  100 |   public async clickStartChat(): Promise<void> {
  101 |     await this.startChatButton.click();
  102 |   }
  103 | 
  104 |   public getSelectedLanguage(): Promise<string> {
  105 |     return this.page.locator('#language').inputValue();
  106 |   }
  107 | 
  108 |   public getSelectedProductArea(): Promise<string> {
  109 |     return this.page.locator('#productArea').inputValue();
  110 |   }
  111 | 
  112 |   public getValidationErrors(): Promise<string[]> {
  113 |     return this.page
  114 |       .locator('[id*="Error"], [class*="error" i]')
  115 |       .allTextContents()
  116 |       .then((texts) => texts.map((t) => t.trim()).filter((t) => t.length > 0));
  117 |   }
  118 | }
  119 | 
```