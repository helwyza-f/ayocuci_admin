import * as XLSX from "xlsx";

type ExcelCellValue = string | number | Date | null | undefined;

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  /** Optional transform function to format cell value */
  format?: (value: ExcelCellValue, row: Record<string, unknown>) => string | number;
}

export interface ExcelSheet<T extends object = Record<string, unknown>> {
  data: T[];
  columns: ExcelColumn[];
  sheetName: string;
}

function buildSheetRows<T extends object>(
  data: T[],
  columns: ExcelColumn[],
) {
  return data.map((row) =>
    columns.reduce((acc, col) => {
      const typedRow = row as Record<string, unknown>;
      const raw = typedRow[col.key] as ExcelCellValue;
      acc[col.header] = col.format ? col.format(raw, typedRow) : (raw ?? "");
      return acc;
    }, {} as Record<string, unknown>)
  );
}

function buildWorksheet<T extends object>(data: T[], columns: ExcelColumn[]) {
  const rows = buildSheetRows(data, columns);

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 20 }));
  return ws;
}

function buildTimestampedFilename(filename: string) {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `${filename}_${ts}.xlsx`;
}

export function exportToExcel<T extends object>(
  data: T[],
  columns: ExcelColumn[],
  filename: string,
  sheetName = "Data"
) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildWorksheet(data, columns), sheetName);
  XLSX.writeFile(wb, buildTimestampedFilename(filename));
}

export function exportSheetsToExcel(
  sheets: Array<ExcelSheet<object>>,
  filename: string,
) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(
      wb,
      buildWorksheet(sheet.data, sheet.columns),
      sheet.sheetName,
    );
  });
  XLSX.writeFile(wb, buildTimestampedFilename(filename));
}
