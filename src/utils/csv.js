function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[";\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

/**
 * Brauzerda CSV fayl yuklab beradi. Excel uchun BOM va nuqtali vergul ishlatiladi.
 */
export function downloadCsv(filename, rows) {
  const content = rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
