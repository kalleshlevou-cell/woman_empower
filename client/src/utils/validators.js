/**
 * PAN validation regex: AAAAA0000A
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * Validate PAN string
 * @param {string} pan
 * @returns {boolean}
 */
export function isValidPan(pan) {
  return PAN_REGEX.test(pan);
}

/**
 * Validate 10-digit Indian mobile number
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  return /^\d{10}$/.test(phone);
}
