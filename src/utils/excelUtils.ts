/**
 * Generic Excel reader - reads any .xlsx/.xls sheet into an array of row
 * objects keyed by header row, with no assumptions about column layout.
 * Lets anyone cloning this repo drop in their own test-case sheet (Zephyr,
 * TestRail export, a spreadsheet a PM maintains, etc.) and read it the same way.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';

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
export function readExcelSheet(filePath: string, options: ReadExcelOptions = {}): ExcelRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = options.sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(
      `Sheet "${sheetName}" not found in ${filePath}. Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const headerRowIndex = (options.headerRow ?? 1) - 1;
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });

  const headers = (rows[headerRowIndex] ?? []).map((header) => String(header).trim());
  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows.map((row) => {
    const record: ExcelRow = {};
    headers.forEach((header, index) => {
      if (header) record[header] = String(row[index] ?? '').trim();
    });
    return record;
  });
}

/** Lists the sheet names in a workbook, e.g. to discover a sheet before reading it. */
export function listExcelSheets(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  return XLSX.readFile(filePath).SheetNames;
}

export interface ExcelCellOptions {
  /** Sheet to read/write. Defaults to the first sheet in the workbook. */
  sheetName?: string;
}

function loadSheet(filePath: string, sheetName?: string): { workbook: XLSX.WorkBook; sheet: XLSX.WorkSheet; sheetName: string } {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  const workbook = XLSX.readFile(filePath);
  const resolvedSheetName = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[resolvedSheetName];
  if (!sheet) {
    throw new Error(
      `Sheet "${resolvedSheetName}" not found in ${filePath}. Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }
  return { workbook, sheet, sheetName: resolvedSheetName };
}

/**
 * Reads a single cell (e.g. 'B3') as text. Returns '' if the cell is blank.
 */
export function readExcelCell(filePath: string, cellRef: string, options: ExcelCellOptions = {}): string {
  const { sheet } = loadSheet(filePath, options.sheetName);
  const cell = sheet[cellRef];
  return cell === undefined ? '' : String(cell.v ?? '').trim();
}

/**
 * Writes rows (array of objects keyed by header) into a sheet, creating the file/sheet
 * if needed. Headers are taken from the keys of the first row, in insertion order.
 * Replaces the target sheet's contents; other sheets in an existing workbook are preserved.
 */
export function writeExcelSheet(filePath: string, rows: ExcelRow[], options: ExcelCellOptions = {}): void {
  const sheetName = options.sheetName ?? 'Sheet1';
  const workbook = fs.existsSync(filePath) ? XLSX.readFile(filePath) : XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(rows);

  if (workbook.SheetNames.includes(sheetName)) {
    workbook.Sheets[sheetName] = newSheet;
  } else {
    XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
  }

  XLSX.writeFile(workbook, filePath);
}

/**
 * Writes a single cell's value (e.g. 'B3'), creating the file/sheet if needed.
 * Other cells in the sheet are left untouched.
 */
export function writeExcelCell(
  filePath: string,
  cellRef: string,
  value: string | number,
  options: ExcelCellOptions = {},
): void {
  const sheetName = options.sheetName ?? 'Sheet1';
  const workbook = fs.existsSync(filePath) ? XLSX.readFile(filePath) : XLSX.utils.book_new();

  if (!workbook.Sheets[sheetName]) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), sheetName);
  }

  const sheet = workbook.Sheets[sheetName];
  XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cellRef });

  const range = XLSX.utils.decode_range(sheet['!ref'] ?? cellRef);
  const cellAddress = XLSX.utils.decode_cell(cellRef);
  range.s.r = Math.min(range.s.r, cellAddress.r);
  range.s.c = Math.min(range.s.c, cellAddress.c);
  range.e.r = Math.max(range.e.r, cellAddress.r);
  range.e.c = Math.max(range.e.c, cellAddress.c);
  sheet['!ref'] = XLSX.utils.encode_range(range);

  XLSX.writeFile(workbook, filePath);
}

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

/** Reads a sheet's full grid of cell text, keyed by cell ref (e.g. 'A1'). */
function readSheetGrid(sheet: XLSX.WorkSheet): Map<string, string> {
  const grid = new Map<string, string>();
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      const value = cell === undefined ? '' : String(cell.v ?? '').trim();
      if (value !== '') grid.set(cellRef, value);
    }
  }
  return grid;
}

/**
 * Compares two workbooks sheet-by-sheet and cell-by-cell. Sheets present in only one
 * file are reported as a single difference entry per missing sheet.
 */
export function compareExcelFiles(filePathA: string, filePathB: string): ExcelComparisonResult {
  if (!fs.existsSync(filePathA)) throw new Error(`Excel file not found: ${filePathA}`);
  if (!fs.existsSync(filePathB)) throw new Error(`Excel file not found: ${filePathB}`);

  const workbookA = XLSX.readFile(filePathA);
  const workbookB = XLSX.readFile(filePathB);
  const sheetNames = Array.from(new Set([...workbookA.SheetNames, ...workbookB.SheetNames]));
  const differences: CellDifference[] = [];

  for (const sheetName of sheetNames) {
    const sheetA = workbookA.Sheets[sheetName];
    const sheetB = workbookB.Sheets[sheetName];

    if (!sheetA || !sheetB) {
      differences.push({
        sheet: sheetName,
        cell: '',
        expected: sheetA ? 'present' : 'missing',
        actual: sheetB ? 'present' : 'missing',
      });
      continue;
    }

    const gridA = readSheetGrid(sheetA);
    const gridB = readSheetGrid(sheetB);
    const cellRefs = Array.from(new Set([...gridA.keys(), ...gridB.keys()]));

    for (const cellRef of cellRefs) {
      const expected = gridA.get(cellRef) ?? '';
      const actual = gridB.get(cellRef) ?? '';
      if (expected !== actual) {
        differences.push({ sheet: sheetName, cell: cellRef, expected, actual });
      }
    }
  }

  return { identical: differences.length === 0, differences };
}

export interface ExcelCellVerification {
  matches: boolean;
  expected: string;
  actual: string;
}

/**
 * Reads a single cell and compares it against an expected value, returning both
 * sides so test failures report what was expected vs. what was actually found.
 */
export function verifyExcelCell(
  filePath: string,
  cellRef: string,
  expectedValue: string,
  options: ExcelCellOptions = {},
): ExcelCellVerification {
  const actual = readExcelCell(filePath, cellRef, options);
  return { matches: actual === expectedValue, expected: expectedValue, actual };
}
