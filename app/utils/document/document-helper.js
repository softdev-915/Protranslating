const flattenArray = arr => [].concat(...arr);
const compareIdentifiableEntities = (originalArray, newArray = []) => {
  const newIds = newArray.map((f) => {
    if (f._id && !f.deleted) {
      return f._id.toString();
    }
    return '';
  });
  if (originalArray) {
    const originalIds = originalArray.map(f => f._id.toString());
    return {
      missing: originalArray.filter(f => newIds.indexOf(f._id.toString()) === -1),
      added: newArray.filter(f => f.isNew || originalIds.indexOf(f._id.toString()) === -1),
      existing: originalArray.filter(f => newIds.indexOf(f._id.toString()) !== -1),
    };
  }
  return {
    missing: [],
    added: newIds,
    existing: [],
  };
};

const compareFileArray = (originalArray, newArray) =>
  compareIdentifiableEntities(originalArray, newArray);

const compareVersionableFileArray = (originalArray, newArray) => {
  const originalArr = originalArray ? flattenArray(originalArray) : [];
  const newArr = newArray ? flattenArray(newArray) : [];
  return compareIdentifiableEntities(originalArr, newArr);
};

module.exports = {
  compareIdentifiableEntities,
  compareVersionableFileArray,
  compareFileArray,
};
