export const handlebarsHelpers = {
  formatDate: (date: Date) => new Date(date).toLocaleDateString(),
  uppercase: (str: string) => str.toUpperCase(),
  formatPrice: (price: number) => `$${price.toFixed(2)}`,
  truncate: (str: string, length: number) =>
    str.length > length ? `${str.substring(0, length)}...` : str,
};
