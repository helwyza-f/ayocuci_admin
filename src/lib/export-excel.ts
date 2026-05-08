import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  /** Optional transform function to format cell value */
  format?: (value: any, row: any) => string | number;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string,
  sheetName = "Data"
) {
  // Build rows from data using column mapping
  const rows = data.map((row) =>
    columns.reduce((acc, col) => {
      const raw = row[col.key];
      acc[col.header] = col.format ? col.format(raw, row) : (raw ?? "");
      return acc;
    }, {} as Record<string, any>)
  );

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  // Set column widths
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Timestamp suffix
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}
