import * as fs from "fs";

export function readCsv<T extends Record<string, string> = Record<string, string>>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  const [headerLine, ...lines] = raw.split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = line.split(",").map((value) => value.trim());
      return headers.reduce((row, header, index) => {
        row[header] = values[index];
        return row;
      }, {} as Record<string, string>) as T;
    });
}
