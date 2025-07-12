const logger = require("./logger");

const convertToArray = strArr => {
  let strArray = [];
  if (!strArr || strArr === 'undefined') {
    return strArray; // Return empty array instead of throwing error
  }

  if (Array.isArray(strArr)) {
    strArray = strArr.map(spec => spec.toString().trim());
  } else if (typeof strArr === 'string') {
    // Try to parse as JSON first
    if (strArr.startsWith('[') && strArr.endsWith(']')) {
      try {
        strArray = JSON.parse(strArr);
        if (!Array.isArray(strArray)) {
          strArray = [strArr];
        }
      } catch (e) {
        // If JSON parse fails, split by comma
        strArray = strArr.split(',').map(str => str.trim());
      }
    } else {
      // Split by comma for regular comma-separated strings
      strArray = strArr.split(',').map(str => str.trim());
    }
  } else {
    // Convert other types to string and put in array
    strArray = [strArr.toString()];
  }

  logger.info('Converted string to array:', {
    original: strArr,
    converted: strArray
  });

  return strArray;
};

module.exports = { convertToArray };
