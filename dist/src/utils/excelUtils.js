"use strict";
/**
 * Generic Excel reader - reads any .xlsx/.xls sheet into an array of row
 * objects keyed by header row, with no assumptions about column layout.
 * Lets anyone cloning this repo drop in their own test-case sheet (Zephyr,
 * TestRail export, a spreadsheet a PM maintains, etc.) and read it the same way.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readExcelSheet = readExcelSheet;
exports.listExcelSheets = listExcelSheets;
exports.readExcelCell = readExcelCell;
exports.writeExcelSheet = writeExcelSheet;
exports.writeExcelCell = writeExcelCell;
exports.compareExcelFiles = compareExcelFiles;
exports.verifyExcelCell = verifyExcelCell;
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
/**
 * Reads a sheet into an array of objects, one per data row, keyed by the
 * header cell text in that column. Empty cells are read as ''.
 */
function readExcelSheet(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = options.sheetName ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found in ${filePath}. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    const headerRowIndex = (options.headerRow ?? 1) - 1;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
    const headers = (rows[headerRowIndex] ?? []).map((header) => String(header).trim());
    const dataRows = rows.slice(headerRowIndex + 1);
    return dataRows.map((row) => {
        const record = {};
        headers.forEach((header, index) => {
            if (header)
                record[header] = String(row[index] ?? '').trim();
        });
        return record;
    });
}
/** Lists the sheet names in a workbook, e.g. to discover a sheet before reading it. */
function listExcelSheets(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
    }
    return XLSX.readFile(filePath).SheetNames;
}
function loadSheet(filePath, sheetName) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
    }
    const workbook = XLSX.readFile(filePath);
    const resolvedSheetName = sheetName ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[resolvedSheetName];
    if (!sheet) {
        throw new Error(`Sheet "${resolvedSheetName}" not found in ${filePath}. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    return { workbook, sheet, sheetName: resolvedSheetName };
}
/**
 * Reads a single cell (e.g. 'B3') as text. Returns '' if the cell is blank.
 */
function readExcelCell(filePath, cellRef, options = {}) {
    const { sheet } = loadSheet(filePath, options.sheetName);
    const cell = sheet[cellRef];
    return cell === undefined ? '' : String(cell.v ?? '').trim();
}
/**
 * Writes rows (array of objects keyed by header) into a sheet, creating the file/sheet
 * if needed. Headers are taken from the keys of the first row, in insertion order.
 * Replaces the target sheet's contents; other sheets in an existing workbook are preserved.
 */
function writeExcelSheet(filePath, rows, options = {}) {
    const sheetName = options.sheetName ?? 'Sheet1';
    const workbook = fs.existsSync(filePath) ? XLSX.readFile(filePath) : XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(rows);
    if (workbook.SheetNames.includes(sheetName)) {
        workbook.Sheets[sheetName] = newSheet;
    }
    else {
        XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
    }
    XLSX.writeFile(workbook, filePath);
}
/**
 * Writes a single cell's value (e.g. 'B3'), creating the file/sheet if needed.
 * Other cells in the sheet are left untouched.
 */
function writeExcelCell(filePath, cellRef, value, options = {}) {
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
/** Reads a sheet's full grid of cell text, keyed by cell ref (e.g. 'A1'). */
function readSheetGrid(sheet) {
    const grid = new Map();
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[cellRef];
            const value = cell === undefined ? '' : String(cell.v ?? '').trim();
            if (value !== '')
                grid.set(cellRef, value);
        }
    }
    return grid;
}
/**
 * Compares two workbooks sheet-by-sheet and cell-by-cell. Sheets present in only one
 * file are reported as a single difference entry per missing sheet.
 */
function compareExcelFiles(filePathA, filePathB) {
    if (!fs.existsSync(filePathA))
        throw new Error(`Excel file not found: ${filePathA}`);
    if (!fs.existsSync(filePathB))
        throw new Error(`Excel file not found: ${filePathB}`);
    const workbookA = XLSX.readFile(filePathA);
    const workbookB = XLSX.readFile(filePathB);
    const sheetNames = Array.from(new Set([...workbookA.SheetNames, ...workbookB.SheetNames]));
    const differences = [];
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
/**
 * Reads a single cell and compares it against an expected value, returning both
 * sides so test failures report what was expected vs. what was actually found.
 */
function verifyExcelCell(filePath, cellRef, expectedValue, options = {}) {
    const actual = readExcelCell(filePath, cellRef, options);
    return { matches: actual === expectedValue, expected: expectedValue, actual };
}
