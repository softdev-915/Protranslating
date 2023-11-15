import {
  differenceWith, toPairs, isEqual, keys, fromPairs,
} from 'lodash';

export const getObjectDifferences = (objectOne, objectTwo) => {
  const differences = differenceWith(toPairs(objectOne), toPairs(objectTwo), isEqual);
  return keys(fromPairs(differences));
};
