
const BIG_IP_COLUMNS = [
  {
    name: 'Patent App.Num', type: 'string', prop: 'ipPatent.patentApplicationNumber', visible: true,
  },
  {
    name: 'Patent Pub.Num', type: 'string', prop: 'ipPatent.patentPublicationNumber', visible: true,
  },
];

export default class CommonService {
  constructor(resource) {
    this.resource = resource;
  }

  buildIpColumns(columns, siblingColumnProp) {
    const bigIpColumns = [];
    columns.forEach((col) => {
      if (col.prop === 'title') bigIpColumns.push(Object.assign(col, { visible: false }));
      else if (col.prop === 'foreignInvoiceTotal') bigIpColumns.push(Object.assign(col, { visible: false }));
      else bigIpColumns.push(col);
    });
    const contactColumnIndex = bigIpColumns.findIndex((c) => c.prop === siblingColumnProp);
    bigIpColumns.splice(contactColumnIndex + 1, 0, ...BIG_IP_COLUMNS);
    return bigIpColumns;
  }
}
