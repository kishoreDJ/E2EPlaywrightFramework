"use strict";
/**
 * Browser Types - Shared interfaces and types for browser management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POOL_CONFIG = exports.VIEWPORT_PRESETS = void 0;
exports.VIEWPORT_PRESETS = {
    HD: { width: 1280, height: 720 },
    FULL_HD: { width: 1920, height: 1080 },
    WQHD: { width: 2560, height: 1440 },
    MOBILE_S: { width: 375, height: 667 },
    MOBILE_L: { width: 414, height: 896 },
    TABLET: { width: 768, height: 1024 },
};
exports.DEFAULT_POOL_CONFIG = {
    maxSize: 10,
    minIdle: 2,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 300000,
    maxUsageCount: 50,
};
