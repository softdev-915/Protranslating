import _ from 'lodash';

const collectionUnion = function (...args) {
  const it = args.pop();
  return _.uniqBy(_.flatten(args, true), it);
};

const sharedColumns = [
  {
    name: 'Created at', type: 'string', prop: 'createdAt', visible: false,
  },
  {
    name: 'Updated at', type: 'string', prop: 'updatedAt', visible: false,
  },
  {
    name: 'Deleted at', type: 'string', prop: 'deletedAt', visible: false,
  },
  {
    name: 'Restored at', type: 'string', prop: 'restoredAt', visible: false,
  },
  {
    name: 'Created by', type: 'string', prop: 'createdBy', visible: false,
  },
  {
    name: 'Updated by', type: 'string', prop: 'updatedBy', visible: false,
  },
  {
    name: 'Deleted by', type: 'string', prop: 'deletedBy', visible: false,
  },
  {
    name: 'Restored by', type: 'string', prop: 'restoredBy', visible: false,
  },
];
const extendColumns = (cols) => collectionUnion(cols, sharedColumns, 'prop');

export default extendColumns;
