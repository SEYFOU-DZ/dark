export function formatDateTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVehicleValue(value: number): string {
  return `AED ${formatCurrency(value)}`;
}

export function generateQuotationNo(date = new Date()): string {
  const year = date.getFullYear();
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `MT-${year}-${random}`;
}
