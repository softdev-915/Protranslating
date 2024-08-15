import _ from 'lodash';
import { getId } from '../../../utils/request-entity';

export const transformLang = (lang) => ({
  name: lang.name,
  isoCode: lang.isoCode,
});

const transformDocument = (doc) => {
  const transformed = {
    _id: getId(doc),
    name: doc.name,
    language: (doc.language && doc.language.name) ? doc.language : null,
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
const LOST_STATUS = 'Lost';

export const transformOpportunity = (opportunity) => {
  const transformed = _.cloneDeep(opportunity);
  Object.assign(transformed, {
    srcLang: transformLang(opportunity.srcLang),
    tgtLangs: opportunity.tgtLangs.map(transformLang),
    company: _.get(opportunity.company, '_id', opportunity.company),
    contact: _.get(opportunity.contact, '_id', opportunity.contact),
    documents: opportunity.documents.map(transformDocument),
    salesRep: _.get(opportunity.salesRep, '_id', opportunity.salesRep),
  });
  if (opportunity.secondaryContacts && opportunity.secondaryContacts.length > 0) {
    transformed.secondaryContacts = opportunity.secondaryContacts.map((c) => _.get(c, '_id', c));
  }
  if (opportunity.status !== LOST_STATUS) {
    delete transformed.lostReason;
  }
  return transformed;
};
