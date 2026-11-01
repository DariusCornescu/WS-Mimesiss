/** Quote cells and neutralize spreadsheet formulas in user-controlled text. */
export function escapeCsvCell(value: string | null | undefined): string {
  if (value == null) return '""'
  let text = String(value)
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}
