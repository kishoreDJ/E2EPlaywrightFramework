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
