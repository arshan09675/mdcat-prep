/** Format an integer rupee amount as "Rs 1,500". */
export function formatPkr(rupees: number): string {
  return `Rs ${rupees.toLocaleString("en-PK")}`;
}
