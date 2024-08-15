import _ from 'lodash';
import { getId } from '../../../utils/request-entity';

const transformDocument = (doc) => {
  const transformed = {
    _id: getId(doc),
    name: doc.name,
    isReference: doc.isReference || false,
    isInternal: doc.isInternal || false,
    isNew: doc.isNew || false,
    final: doc.final || false,
    size: _.get(doc, 'size', 0),
    mime: _.get(doc, 'mime', 'unknown'),
    cloudKey: _.get(doc, 'cloudKey', ''),
    removed: doc.removed || false,
    oldId: doc.oldId || null,
    md5Hash: _.get(doc, 'md5Hash', ''),
  };
  return transformed;
};

export const transformBillAdjustment = (billAdjustment) => {
  const transformed = _.cloneDeep(billAdjustment);
  if (!_.isEmpty(transformed.lineItems)) {
    transformed.lineItems.forEach((li) => {
      li.glAccountNo = li.glAccountNo._id;
    });
  }
  Object.assign(transformed, {
    documents: billAdjustment.documents.map(transformDocument),
  });
  return _.pickBy(transformed, (prop) => !_.isNil(prop));
};
