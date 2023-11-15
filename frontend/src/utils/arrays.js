import _ from 'lodash';

export const swapArrayElements = (arr, source, dest) => {
  if (!Array.isArray(arr)) {
    throw new Error('swapArrayElements: an Array was expected');
  }
  // Clone the array but no the inner objects
  const arrClone = arr.slice();
  if (arrClone[source] === undefined || arrClone[dest] === undefined) {
    return arrClone;
  }
  const aux = arrClone[dest];
  arrClone[dest] = arrClone[source];
  arrClone[source] = aux;
  return arrClone;
};

export const extractChildArray = (arr, property) => _.flatten(_.map(arr, (obj) => _.get(obj, property, [])));

export const joinObjectsByProperty = (arr, property, separator = ',') => {
  if (!Array.isArray(arr)) {
    arr = [arr];
  }
  return arr.map((object) => _.get(object, property, '')).join(separator);
};
