import _ from 'lodash';
import GridTable from '../grid-table/grid-table';

const naiveKeyForItem = function (item, index) {
  const _id = _.get(item, '_id');
  const id = _.get(item, 'id', _id);
  return _.defaultTo(id, index);
};

export default {
  extends: GridTable,
  props: {
    gridConfigApplied: {
      type: Boolean,
      default: true,
    },
    rowSelectionDisabled: {
      type: Boolean,
      default: true,
    },
    keyForItem: {
      type: Function,
      default: naiveKeyForItem,
    },
  },
};
