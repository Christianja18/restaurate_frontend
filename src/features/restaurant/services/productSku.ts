const SKU_STOP_WORDS = new Set([
  'A',
  'AL',
  'CON',
  'DE',
  'DEL',
  'EL',
  'EN',
  'LA',
  'LAS',
  'LOS',
  'POR',
  'Y',
])

export function buildProductoSkuPrefix(nombre: string): string {
  const words =
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .match(/[A-Z0-9]+/g) ?? []
  const significantWords = words.filter((word) => !SKU_STOP_WORDS.has(word))
  const selectedWords =
    significantWords.length > 0 ? significantWords.slice(0, 2) : words.slice(0, 2)
  const prefix = selectedWords.map((word) => word.slice(0, 3)).join('-')

  return prefix || 'PROD'
}

export function buildNextProductoSku(
  nombre: string,
  existingSkus: readonly (string | null)[],
): string {
  const prefix = buildProductoSkuPrefix(nombre)
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d{3,})$`)
  const lastSkuNumber = existingSkus.reduce((maxNumber, sku) => {
    const match = sku?.match(pattern)
    const numericCode = match ? Number(match[1]) : Number.NaN
    return Number.isInteger(numericCode)
      ? Math.max(maxNumber, numericCode)
      : maxNumber
  }, 0)

  return `${prefix}-${String(lastSkuNumber + 1).padStart(3, '0')}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
