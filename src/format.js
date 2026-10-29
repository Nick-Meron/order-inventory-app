// 4.5 or "4.50" -> "$4.50"
export function formatMoney(value) {
  const number = Number(value) || 0;
  return `$${number.toFixed(2)}`;
}

// "pending" -> "Pending"
export function formatStatus(status) {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}