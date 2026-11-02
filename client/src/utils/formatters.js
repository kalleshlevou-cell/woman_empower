/**
 * Format paise (integer) to INR currency string
 * @param {number} paise
 * @returns {string}
 */
export function formatINR(paise) {
  if (paise == null) return '—';
  const amount = paise / 100;
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

/**
 * Format ISO date string to DD-MM-YYYY
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Truncate string to max characters
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 120) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
