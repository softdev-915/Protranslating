const units = {
  b: 1,
  kb: 1024,
  mb: 1048576,
  gb: 1073741824,
};

const chooseProperUnit = (size) => {
  if (size >= 1024 && size < 1048576) {
    return 'kb';
  } if (size >= 1048576 && size < 1073741824) {
    return 'mb';
  }
  return 'gb';
};

const virtualSize = (size, toUnit) => {
  // from units assumed bytes
  if (size) {
    const fu = 'b';
    const tu = toUnit || chooseProperUnit(size);
    const fUnit = units[fu];
    const tUnit = units[tu];
    const transformedSize = (fUnit * size) / tUnit;
    return `${transformedSize.toFixed(2)} ${tu}`;
  }
  return size;
};

export default virtualSize;
