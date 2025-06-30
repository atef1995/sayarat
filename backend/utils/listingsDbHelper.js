const convertToArray = specs => {
  let specsArray = [];
  if (!specs || specs !== 'undefined') {
    return specsArray;
  }

  if (Array.isArray(specs)) {
    specsArray = specs.map(spec => spec.trim());
  } else if (typeof specs === 'string') {
    specsArray.push(specs.trim());
  } else {
    specsArray = specs.split(',').map(spec => spec.trim());
  }

  return specsArray;
};

module.exports = { convertToArray };
