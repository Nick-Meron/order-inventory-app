// 4.5 or "4.50" -> "Rs. 4.50"
// 1250 -> "Rs. 1,250.00"
export function formatMoney(value) {
  const number = Number(value) || 0;
  const fixed = Math.abs(number).toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = number < 0 ? '-' : '';
  return `${sign}Rs. ${withCommas}.${decimals}`;
}

// "pending" -> "Pending"
export function formatStatus(status) {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}