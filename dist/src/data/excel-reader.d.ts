/**
 * Generic Excel reader - reads any .xlsx/.xls sheet into an array of row
 * objects keyed by header row, with no assumptions about column layout.
 * Lets anyone cloning this repo drop in their own test-case sheet (Zephyr,
 * TestRail export, a spreadsheet a PM maintains, etc.) and read it the same way.
 */
export type ExcelRow = Record<string, string>;
export interface ReadExcelOptions {
    /** Sheet to read. Defaults to the first sheet in the workbook. */
    sheetName?: string;
    /** Row number (1-based) containing column headers. Defaults to 1. */
    headerRow?: number;
}
/**
 * Reads a sheet into an array of objects, one per data row, keyed by the
 * header cell text in that column. Empty cells are read as ''.
 */
export declare function readExcelSheet(filePath: string, options?: ReadExcelOptions): ExcelRow[];
/** Lists the sheet names in a workbook, e.g. to discover a sheet before reading it. */
export declare function listExcelSheets(filePath: string): string[];
//# sourceMappingURL=excel-reader.d.ts.map