/**
 * Formats a date string into Syrian format with Arabic locale
 * @param dateString - The date string to format
 * @returns Formatted date string in Syrian format
 */
export const formatToSyrianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date string");
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };

    return new Intl.DateTimeFormat("ar-SY", options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};
