export function required(value, message = "Bu maydon to'ldirilishi shart") {
  if (value === null || value === undefined) return message
  if (typeof value === 'string' && !value.trim()) return message
  if (Array.isArray(value) && !value.length) return message
  return ''
}

export function isPhone(value) {
  if (!value) return "Telefon raqam kiritilishi shart"
  const digits = String(value).replace(/\D/g, '')
  if (!(digits.length === 12 && digits.startsWith('998'))) {
    return "Telefon raqam +998 XX XXX XX XX formatida bo'lishi kerak"
  }
  return ''
}

export function isEmail(value, { optional = true } = {}) {
  if (!value) return optional ? '' : 'Email kiritilishi shart'
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
    ? ''
    : "Email manzil noto'g'ri kiritilgan"
}

export function isPositiveNumber(value, message = "Musbat son kiritilishi shart") {
  if (value === '' || value === null || value === undefined) return message
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? '' : message
}

export function isNonNegativeNumber(value, message = "Son 0 dan kichik bo'lmasligi kerak") {
  if (value === '' || value === null || value === undefined) return message
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? '' : message
}

export function isDate(value, message = "Sana kiritilishi shart") {
  if (!value) return message
  return Number.isNaN(new Date(value).getTime()) ? "Sana noto'g'ri" : ''
}

export function minLength(value, length, message) {
  if (!value || String(value).length < length) {
    return message || `Kamida ${length} ta belgi kiritilishi kerak`
  }
  return ''
}

export function validateFields(values, rules) {
  const errors = {}
  Object.entries(rules).forEach(([field, validators]) => {
    const list = Array.isArray(validators) ? validators : [validators]
    for (const validate of list) {
      const message = validate(values[field], values)
      if (message) {
        errors[field] = message
        break
      }
    }
  })
  return errors
}

export function hasErrors(errors = {}) {
  return Object.keys(errors).length > 0
}
