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
export interface ExcelCellOptions {
    /** Sheet to read/write. Defaults to the first sheet in the workbook. */
    sheetName?: string;
}
/**
 * Reads a single cell (e.g. 'B3') as text. Returns '' if the cell is blank.
 */
export declare function readExcelCell(filePath: string, cellRef: string, options?: ExcelCellOptions): string;
/**
 * Writes rows (array of objects keyed by header) into a sheet, creating the file/sheet
 * if needed. Headers are taken from the keys of the first row, in insertion order.
 * Replaces the target sheet's contents; other sheets in an existing workbook are preserved.
 */
export declare function writeExcelSheet(filePath: string, rows: ExcelRow[], options?: ExcelCellOptions): void;
/**
 * Writes a single cell's value (e.g. 'B3'), creating the file/sheet if needed.
 * Other cells in the sheet are left untouched.
 */
export declare function writeExcelCell(filePath: string, cellRef: string, value: string | number, options?: ExcelCellOptions): void;
export interface CellDifference {
    sheet: string;
    cell: string;
    expected: string;
    actual: string;
}
export interface ExcelComparisonResult {
    identical: boolean;
    differences: CellDifference[];
}
/**
 * Compares two workbooks sheet-by-sheet and cell-by-cell. Sheets present in only one
 * file are reported as a single difference entry per missing sheet.
 */
export declare function compareExcelFiles(filePathA: string, filePathB: string): ExcelComparisonResult;
export interface ExcelCellVerification {
    matches: boolean;
    expected: string;
    actual: string;
}
/**
 * Reads a single cell and compares it against an expected value, returning both
 * sides so test failures report what was expected vs. what was actually found.
 */
export declare function verifyExcelCell(filePath: string, cellRef: string, expectedValue: string, options?: ExcelCellOptions): ExcelCellVerification;
//# sourceMappingURL=excelUtils.d.ts.map