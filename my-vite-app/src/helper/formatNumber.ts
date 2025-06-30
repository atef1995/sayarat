const formatNumber = (
  value: number | string,
  locale: string = "ar-SY"
): string => {
  if (typeof value === "number") {
    return value.toLocaleString(locale);
  } else if (typeof value === "string") {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue.toLocaleString(locale);
    }
  }
  return "";
};

const formatYearToArabic = (year: number | undefined): string => {
  if (typeof year === "number") {
    return year.toLocaleString("ar-SY", {
      // remove the commas
      useGrouping: false,
    });
  }
  return year || "";
};

export { formatNumber, formatYearToArabic };
