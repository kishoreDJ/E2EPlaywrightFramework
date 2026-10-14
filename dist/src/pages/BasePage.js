"use strict";
/**
 * Base Page - shared navigation and wait helpers for all page objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
const logger_1 = require("../utils/logger");
class BasePage {
    constructor(page) {
        this.page = page;
        this.log = (0, logger_1.createLogger)(this.constructor.name);
    }
    async goto(path = '/') {
        this.log.info(`Navigating to: ${path}`);
        await this.page.goto(path);
    }
    async waitForPageLoad() {
        this.log.debug('Waiting for networkidle');
        await this.page.waitForLoadState('networkidle');
    }
    getTitle() {
        return this.page.title();
    }
    getUrl() {
        return this.page.url();
    }
    async clickNavLink(linkText) {
        this.log.info(`Clicking nav link: "${linkText}"`);
        await this.page.getByText(linkText, { exact: true }).first().click();
        await this.waitForPageLoad();
    }
    /** Closes an overlay/modal if one happens to be visible, otherwise no-ops. */
    async closePopupIfPresent(closeButtonText = 'Close') {
        const closeButton = this.page.getByText(closeButtonText, { exact: true });
        if (await closeButton.isVisible().catch(() => false)) {
            this.log.info(`Closing popup: "${closeButtonText}"`);
            await closeButton.click();
        }
    }
}
exports.BasePage = BasePage;
